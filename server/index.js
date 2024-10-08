const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config()
const app = express();
const PORT = process.env.PORT || 5000;
const JOBS_FILE = path.join(__dirname, 'jobs.json');
const cors = require('cors');
app.use(express.json());
app.use(cors());

async function readJobs() {
  try {
    const data = await fs.readFile(JOBS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}


async function writeJobs(jobs) {
  await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

function getRandomDelay() {
  return Math.floor(Math.random() * 60) * 5000 + 5000;
}


async function processJob(jobId) {
  const jobs = await readJobs();
  const jobIndex = jobs.findIndex(job => job.id === jobId);
  
  if (jobIndex === -1) {
    console.error(`Job ${jobId} not found`);
    return;
  }

  try {
    const response = await axios.get('https://api.unsplash.com/photos/random?food', {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
     });
     const imagePath=response?.data?.urls?.full;

    jobs[jobIndex].status = 'completed';
    jobs[jobIndex].result = imagePath;
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    jobs[jobIndex].status = 'failed';
    jobs[jobIndex].error = error.message;
  }

  await writeJobs(jobs);
}


app.post('/jobs', async (req, res) => {
  try {
    const jobs = await readJobs();
    const newJob = {
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    jobs.push(newJob);
    await writeJobs(jobs);

   
    setTimeout(() => processJob(newJob.id), getRandomDelay());

    res.status(201).json({ id: newJob.id });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/jobs', async (req, res) => {
  try {
    let { status,sort,page } = req.query;
    if(!page) page=1;
    if(!sort) sort='desc';
    if(!status) status='all';
    let jobs = await readJobs();
    if(status!=='all'){
      jobs = jobs.filter(job => job.status === status);
    }
    if(sort==='asc'){
      jobs.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    }else{
      jobs.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    }
    const pageSize=10;
    const startIndex=(page-1)*pageSize;
    const endIndex=page*pageSize;
    const total=Math.ceil(jobs.length/pageSize);
    jobs=jobs.slice(startIndex,endIndex);

    res.status(200).json({
      jobs,
      totalPages:total
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/jobs/:id', async (req, res) => {
  try {
    const jobs = await readJobs();
    const job = jobs.find(job => job.id === req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


setInterval(async () => {
  try {
    const jobs = await readJobs();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const updatedJobs = jobs.filter(job => new Date(job.createdAt) > twentyFourHoursAgo);
    
    if (updatedJobs.length < jobs.length) {
      await writeJobs(updatedJobs);
      console.log(`Cleaned up ${jobs.length - updatedJobs.length} old jobs`);
    }
  } catch (error) {
    console.error('Error during job cleanup:', error);
  }
}, 60 * 60 * 1000);
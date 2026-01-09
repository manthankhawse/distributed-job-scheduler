const apiUrl : string = import.meta.env.VITE_API_URL;

const fetchJobs = async ()=>{
    const res = await fetch(`${apiUrl}/jobs`)
    return await res.json();
}

export default fetchJobs;
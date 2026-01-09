const apiUrl : string = import.meta.env.VITE_API_URL;

const getJobById = async (id: string)=>{
    const res = await fetch(`${apiUrl}/jobs/${id}`)
    return await res.json();
}

export default getJobById;
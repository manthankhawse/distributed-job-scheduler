const apiUrl : string = import.meta.env.VITE_API_URL;

const fetchWorkflows = async () => {
    const res = await fetch(`${apiUrl}/workflows`);
    return (await res.json()).workflows;
}

export default fetchWorkflows;
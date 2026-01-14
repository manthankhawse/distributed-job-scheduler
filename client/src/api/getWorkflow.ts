const apiUrl : string = import.meta.env.VITE_API_URL;

const getWorkflowById = async (id: string) => {
    const res = await fetch(`${apiUrl}/workflows/${id}`);
    return (await res.json()).workflow;
}

export default getWorkflowById;
const apiUrl : string = import.meta.env.VITE_API_URL;

export const createJob = async (formData: FormData) => {
    const response = await fetch(`${apiUrl}/jobs/submit`, {
        method: 'POST',
        body: formData,  
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
};
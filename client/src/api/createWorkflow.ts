const apiUrl : string = import.meta.env.VITE_API_URL;

export interface WorkflowPayload {
    cron?: string; // Optional: "0 * * * *"
    nodes: Array<{
        id: string;
        jobName: string;
        runtime: string;
        handler: string;
        dependencies: string[];
    }>
}

export const createWorkflow = async (payload: WorkflowPayload) => {
    const response = await fetch(`${apiUrl}/workflows/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json(); // Returns { success: true, workflowId: '...' }
};
import { useQuery } from "@tanstack/react-query"
import fetchJobs from "../api/fetchJobs"
import { Link } from "react-router"

function Dashboard() {
    const { isPending, error, data, isFetching } = useQuery({
        queryKey: ['jobs'],
        queryFn: fetchJobs
    })


    if (isPending) return 'Loading...'

    if (error) return 'An error has occurred: ' + error.message

    return (
        <>
            <div>Dashboard</div>

            <div>
                {data.jobs.map((job: any)=>{
                    return <p>
                        <Link to={`/job/${job.jobId}`}>{job.jobId}</Link>
                    </p>
                })}
            </div>

            <div>{isFetching ? 'Updating...' : ''}</div>
        </>
    )
}

export default Dashboard
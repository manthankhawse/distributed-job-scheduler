import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router"
import getJobById from "../api/getJob";

function Job() {

    const {id}  = useParams();

    const { isPending, error, data, isFetching } = useQuery({
        queryKey: [id],
        queryFn: () => { 
            if(!id){
                throw new Error("id not available");
            }
            return getJobById(id);
        }
    })


    if (isPending) return 'Loading...'

    if (error) return 'An error has occurred: ' + error.message

  return (
    <>
    <div>Job id : {id}</div>
    <div>
    {data.job[0].history.map((event: any)=>{
        return <>
            <p>{JSON.stringify(event)}</p>
        </>
    })}
    </div>

    <div>{isFetching ? 'Updating...' : ''}</div>
    </>
  )
}

export default Job
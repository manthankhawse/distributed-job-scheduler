import { useParams } from "react-router"

function Run() {
    const {id, num} = useParams();
  return (
    <div>Run {num} of Job {id}</div>
  )
}

export default Run
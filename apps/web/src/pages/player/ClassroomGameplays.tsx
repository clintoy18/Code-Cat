import { useParams } from 'react-router-dom';
import { AssignedClassroomGameplays } from './AssignedClassroomGameplays';

export const ClassroomGameplays = () => {
  const { classroomId } = useParams();

  return (
    <div className="pixel-page">
      <AssignedClassroomGameplays mode="page" classroomId={classroomId ?? null} />
    </div>
  );
};

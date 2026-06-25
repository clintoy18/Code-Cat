import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useStudentAssignmentsQuery } from '@/features/teacher';

interface IAssignedClassroomGameplaysProps {
  mode?: 'embedded' | 'page';
}

export const AssignedClassroomGameplays = ({
  mode = 'embedded',
}: IAssignedClassroomGameplaysProps) => {
  const navigate = useNavigate();
  const studentAssignmentsQuery = useStudentAssignmentsQuery();
  const assignmentGroups = useMemo(
    () => studentAssignmentsQuery.data ?? [],
    [studentAssignmentsQuery.data],
  );
  const assignmentCount = assignmentGroups.reduce(
    (total, group) => total + group.assignments.length,
    0,
  );
  const assignedRoomCount = assignmentGroups.reduce(
    (total, group) =>
      total +
      group.assignments.reduce(
        (assignmentTotal, entry) =>
          assignmentTotal + entry.assignment.roomManifest.length,
        0,
      ),
    0,
  );
  const assignmentProgressByKey = useMemo(
    () =>
      new Map(
        assignmentGroups.flatMap((group) =>
          group.assignments.flatMap((entry) =>
            entry.progress.map((progress) => [
              `${entry.assignment.id}:${progress.roomKey}`,
              progress,
            ]),
          ),
        ),
      ),
    [assignmentGroups],
  );

  const openPuzzle = (puzzleId: string, assignmentId: string) => {
    navigate(`/gameplay/${puzzleId}?assignmentId=${assignmentId}`);
  };

  if (!assignmentGroups.length) {
    if (mode === 'page') {
      return (
        <div className="pixel-page space-y-6">
          <section className="mission-brief">
            <div className="mission-brief__copy">
              <p className="mission-brief__eyebrow">Classroom Gameplays</p>
              <h1 className="mission-brief__title">
                Assigned classroom work will appear here.
              </h1>
              <p className="mission-brief__objective">
                Once a teacher assigns official rooms or custom classroom
                gameplays, they will show up in this queue with their due dates
                and replay status.
              </p>
            </div>
          </section>
          <section className="pixel-panel">
            <p className="pixel-panel__body">
              No classroom gameplays are assigned right now. Check back after
              your teacher schedules a room for your class.
            </p>
          </section>
        </div>
      );
    }

    return null;
  }

  return (
    <section className="space-y-6">
      {mode === 'page' ? (
        <section className="mission-brief">
          <div className="mission-brief__copy">
            <p className="mission-brief__eyebrow">Classroom Gameplays</p>
            <h1 className="mission-brief__title">
              Teacher-assigned rooms live here.
            </h1>
            <p className="mission-brief__objective">
              Every room in this queue comes from a classroom you are enrolled
              in, including official missions and custom teacher-built
              gameplays.
            </p>
          </div>
          <div className="mission-brief__stats">
            <div className="mission-stat">
              <span className="mission-stat__label">Assignments</span>
              <span className="mission-stat__value">{assignmentCount}</span>
            </div>
            <div className="mission-stat">
              <span className="mission-stat__label">Assigned Rooms</span>
              <span className="mission-stat__value">{assignedRoomCount}</span>
            </div>
            <div className="mission-stat">
              <span className="mission-stat__label">Classrooms</span>
              <span className="mission-stat__value">{assignmentGroups.length}</span>
            </div>
            <div className="mission-stat">
              <span className="mission-stat__label">Custom Rooms</span>
              <span className="mission-stat__value">
                {assignmentGroups.reduce(
                  (total, group) =>
                    total +
                    group.assignments.reduce(
                      (groupTotal, entry) =>
                        groupTotal +
                        entry.assignment.roomManifest.filter(
                          (room) => room.sourceType === 'CUSTOM_ROOM',
                        ).length,
                      0,
                    ),
                  0,
                )}
              </span>
            </div>
          </div>
        </section>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="pixel-kicker">Assigned Rooms</p>
            <h2 className="pixel-panel__title">Teacher classroom work</h2>
            <p className="level-world__description">
              These rooms come from classrooms you are enrolled in. Assigned
              rooms are tracked separately from your base-world progression.
            </p>
          </div>
          <span className="game-chip">
            {assignmentCount} assignments / {assignedRoomCount} rooms
          </span>
        </div>
      )}

      {assignmentGroups.map((group) => (
        <section key={group.classroom.id} className="level-world">
          <div className="level-world__header">
            <div>
              <p className="level-world__eyebrow">Classroom</p>
              <h3 className="level-world__title">{group.classroom.name}</h3>
              <p className="level-world__description">
                {group.classroom.description}
              </p>
            </div>
            <div className="level-world__summary">
              <span className="game-chip">
                {group.assignments.length} assignments
              </span>
              <span className="game-chip">
                Enrolled {new Date(group.enrolledAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {group.assignments.map((entry) => (
              <article key={entry.assignment.id} className="glass-panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="pixel-kicker">Assignment</p>
                    <h4 className="pixel-panel__title">
                      {entry.assignment.title}
                    </h4>
                    <p className="pixel-panel__body">
                      {entry.assignment.description ?? 'No assignment note.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="game-chip">
                      Starts{' '}
                      {new Date(entry.assignment.startAt).toLocaleDateString()}
                    </span>
                    <span className="game-chip">
                      Due{' '}
                      {entry.assignment.dueAt
                        ? new Date(entry.assignment.dueAt).toLocaleDateString()
                        : 'none'}
                    </span>
                  </div>
                </div>

                <section className="level-map mt-4">
                  {entry.assignment.roomManifest.map((room) => {
                    const progress = assignmentProgressByKey.get(
                      `${entry.assignment.id}:${room.roomKey}`,
                    );
                    const isCompleted = progress?.status === 'COMPLETED';
                    const statusLabel = isCompleted
                      ? 'Cleared'
                      : progress?.status === 'IN_PROGRESS'
                        ? 'In Progress'
                        : 'Assigned';

                    return (
                      <article
                        key={`${entry.assignment.id}:${room.roomKey}`}
                        className={`level-card level-card--unlocked ${isCompleted ? 'level-card--completed' : ''}`}
                      >
                        <div className="level-card__header">
                          <div>
                            <p className="level-card__eyebrow">
                              {room.sourceType === 'CUSTOM_ROOM'
                                ? 'Custom Room'
                                : 'Official Room'}
                            </p>
                            <h3 className="level-card__title">{room.title}</h3>
                          </div>
                          <span
                            className={`level-badge ${isCompleted ? 'level-badge--completed' : 'level-badge--open'}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div className="level-card__meta">
                          <span>{room.lesson}</span>
                          <span>{room.difficulty}</span>
                          <span>Par {room.parMoves}</span>
                        </div>

                        <p className="level-card__objective">{room.objective}</p>

                        <div className="level-card__footer">
                          <div className="level-card__track">
                            <span
                              className={`level-dot ${isCompleted ? 'level-dot--completed' : 'level-dot--open'}`}
                            />
                            <span>
                              {progress?.bestLetterGrade
                                ? `Best grade ${progress.bestLetterGrade}`
                                : 'Ready from your classroom assignment'}
                            </span>
                          </div>
                          <Button
                            className={
                              isCompleted
                                ? 'pixel-button pixel-button--ghost'
                                : 'pixel-button'
                            }
                            variant={isCompleted ? 'ghost' : 'primary'}
                            onClick={(event) => {
                              event.stopPropagation();
                              openPuzzle(room.roomKey, entry.assignment.id);
                            }}
                          >
                            {isCompleted
                              ? 'Replay Assignment'
                              : 'Play Assignment'}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              </article>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
};

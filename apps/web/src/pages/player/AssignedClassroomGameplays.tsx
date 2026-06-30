import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState, PaginationControls, PlayerBackLink } from '@/components/shared';
import { Button } from '@/components/ui';
import { useStudentAssignmentsQuery } from '@/features/teacher';

interface IAssignedClassroomGameplaysProps {
  mode?: 'embedded' | 'page';
  classroomId?: string | null;
}

export const AssignedClassroomGameplays = ({
  mode = 'embedded',
  classroomId = null,
}: IAssignedClassroomGameplaysProps) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const isDetailView = mode === 'page' && Boolean(classroomId);
  const studentAssignmentsQuery = useStudentAssignmentsQuery(
    isDetailView
      ? { page: 1, pageSize: 1, classroomId: classroomId ?? undefined }
      : { page, pageSize: 6 },
  );
  const assignmentGroups = useMemo(
    () => studentAssignmentsQuery.data?.items ?? [],
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
  const selectedAssignmentGroup = assignmentGroups[0] ?? null;

  const openPuzzle = (puzzleId: string, assignmentId: string) => {
    navigate(`/gameplay/${puzzleId}?assignmentId=${assignmentId}`);
  };

  if (!assignmentGroups.length) {
    if (mode === 'page') {
      return (
        <div className="pixel-page space-y-6">
          <section className="mission-brief">
            <div className="mission-brief__copy">
              <p className="mission-brief__eyebrow">Classroom Gameplay</p>
              <h1 className="mission-brief__title">
                Teacher-assigned gameplay will appear here.
              </h1>
              <p className="mission-brief__objective">
                Official levels assigned through classrooms and teacher-built
                custom rooms will show up in this queue with their due dates
                and replay status.
              </p>
            </div>
          </section>
          <section className="pixel-panel">
            <EmptyState description="Classroom gameplay will appear here after your teacher schedules a room for one of your classes." />
          </section>
        </div>
      );
    }

    return null;
  }

  if (isDetailView && !selectedAssignmentGroup) {
    return (
      <div className="pixel-page space-y-6">
        <section className="mission-brief">
          <div className="mission-brief__copy">
            <p className="mission-brief__eyebrow">Classroom Gameplay</p>
            <h1 className="mission-brief__title">
              This classroom has no playable rooms right now.
            </h1>
            <p className="mission-brief__objective">
              The classroom may no longer have live assignments, or the link is
              no longer valid. Return to the classroom list and choose another
              class.
            </p>
          </div>
          <div className="mt-6">
            <EmptyState
              description="Playable classroom rooms will appear here after this class has live assignments again."
              action={(
                <Link to="/classroom-gameplays" className="pixel-button pixel-button--ghost">
                  Back to classrooms
                </Link>
              )}
            />
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {mode === 'page' && !isDetailView ? (
        <section className="mission-brief">
          <div className="mission-brief__copy">
            <PlayerBackLink to="/" label="Back to main menu" />
            <p className="mission-brief__eyebrow">Classroom Gameplay</p>
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
              <span className="mission-stat__value">
                {studentAssignmentsQuery.data?.pagination.totalItems ?? assignmentGroups.length}
              </span>
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
      ) : mode !== 'page' ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="pixel-kicker">Classroom Gameplay</p>
            <h2 className="pixel-panel__title">Choose a classroom</h2>
            <p className="level-world__description">
              Open one classroom at a time so its assigned rooms stay easy to
              scan and separate from your base-world progression.
            </p>
          </div>
          <span className="game-chip">
            {assignmentCount} assignments / {assignedRoomCount} rooms
          </span>
        </div>
      ) : null}

      {isDetailView && selectedAssignmentGroup ? (
        <section className="mission-brief">
          <div className="mission-brief__copy">
            <PlayerBackLink to="/classroom-gameplays" label="Back to classrooms" />
            <p className="mission-brief__eyebrow">Selected Classroom</p>
            <h1 className="mission-brief__title">
              {selectedAssignmentGroup.classroom.name}
            </h1>
            <p className="mission-brief__objective">
              {selectedAssignmentGroup.classroom.description}
            </p>
          </div>
          <div className="mission-brief__stats">
            <div className="mission-stat">
              <span className="mission-stat__label">Assignments</span>
              <span className="mission-stat__value">
                {selectedAssignmentGroup.assignments.length}
              </span>
            </div>
            <div className="mission-stat">
              <span className="mission-stat__label">Rooms</span>
              <span className="mission-stat__value">
                {selectedAssignmentGroup.assignments.reduce(
                  (total, entry) => total + entry.assignment.roomManifest.length,
                  0,
                )}
              </span>
            </div>
            <div className="mission-stat">
              <span className="mission-stat__label">Joined</span>
              <span className="mission-stat__value">
                {new Date(selectedAssignmentGroup.enrolledAt).toLocaleDateString()}
              </span>
            </div>
            <div className="mission-stat">
              <span className="mission-stat__label">Track</span>
              <span className="mission-stat__value">Classroom</span>
            </div>
          </div>
        </section>
      ) : null}

      {!isDetailView ? (
        <section className="classroom-gameplayHub">
          <div className="classroom-gameplayHub__grid">
            {assignmentGroups.map((group) => {
              const roomCount = group.assignments.reduce(
                (total, entry) => total + entry.assignment.roomManifest.length,
                0,
              );
              const solvedCount = group.assignments.reduce(
                (total, entry) =>
                  total +
                  entry.progress.filter((progress) => progress.status === 'COMPLETED').length,
                0,
              );

              return (
                <button
                  key={group.classroom.id}
                  type="button"
                  onClick={() => navigate(`/classroom-gameplays/${group.classroom.id}`)}
                  className="world-card world-card--interactive classroom-gameplayCard"
                >
                  <div className="world-card__header">
                    <div>
                      <p className="world-card__eyebrow">Classroom</p>
                      <h3 className="world-card__title">{group.classroom.name}</h3>
                    </div>
                    <span className="world-card__status world-card__status--playable">
                      Open
                    </span>
                  </div>
                  <p className="world-card__description">
                    {group.classroom.description}
                  </p>
                  <div className="world-card__chips">
                    <span>{group.assignments.length} assignments</span>
                    <span>{roomCount} rooms</span>
                    <span>{solvedCount} cleared</span>
                  </div>
                  <div className="world-card__footer">
                    <span>Joined {new Date(group.enrolledAt).toLocaleDateString()}</span>
                    <span>Click to view levels</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {isDetailView && selectedAssignmentGroup ? (
        <section className="level-world">
          <div className="space-y-4">
            {selectedAssignmentGroup.assignments.map((entry) => (
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
      ) : (
        <PaginationControls
          page={studentAssignmentsQuery.data?.pagination.page ?? 1}
          totalPages={studentAssignmentsQuery.data?.pagination.totalPages ?? 1}
          totalItems={studentAssignmentsQuery.data?.pagination.totalItems ?? assignmentGroups.length}
          pageSize={studentAssignmentsQuery.data?.pagination.pageSize ?? 6}
          onPageChange={setPage}
        />
      )}
    </section>
  );
};

type TaskDescriptionProps = {
  description: string | null;
};

function TaskDescription({ description }: TaskDescriptionProps) {
  if (!description) return null;

  return <p className="text-base text-muted-foreground">{description}</p>;
}

export default TaskDescription;
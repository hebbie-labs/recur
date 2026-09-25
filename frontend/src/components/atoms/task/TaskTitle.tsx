type TaskTitleProps = {
  title: string;
};

function TaskTitle({ title }: TaskTitleProps) {
  return <h4 className="mb-2 text-xl font-bold leading-tight tracking-tight">{title}</h4>;
}

export default TaskTitle;
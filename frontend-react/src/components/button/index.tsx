type Props = React.ComponentProps<"button">;

export const Button = (props: Props) => (
  <button
    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
    {...props}
  />
);

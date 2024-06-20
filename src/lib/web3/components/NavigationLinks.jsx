import NavigationLink from "./NavigationLink";

function NavigationLinks() {
  return (
    <ul className="flex items-center gap-x-[18px] text-sm font-bold text-white">
      <NavigationLink text={"Message"} to={"/message"} />
    </ul>
  );
}

export default NavigationLinks;

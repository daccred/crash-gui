/* eslint-disable react/prop-types */
import NavigationLinks from "./NavigationLinks";

function Navbar() {
  return (
    <div className="fixed left-0 top-[33px] z-[30] w-screen px-[50px]">
      <nav
        className={
          "flex h-[70px] w-full items-center justify-between rounded-[60px] bg-[#430F5D] pb-[9px] pl-[50px] pr-[38px] pt-[12px] shadow-shadowPrimary"
        }
      >
        <NavigationLinks />
      </nav>
    </div>
  );
}

export default Navbar;

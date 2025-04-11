import Logo from "./Logo";
import { NavLink } from "react-router";

const NavLinks = () => {
  return (
    <>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/about">Community News Section </NavLink>
    </>
  );
};

const Navbar = () => {
  return <h1>Holaa</h1>;
};
export default Navbar;

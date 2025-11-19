// import gameLogo from '../assets/Logo2.png';
import gameLogo from '../assets/Biglogo.png';
import companyLogo from '../assets/Kult_logo.png';
import './TopBrandBar.css';

const TopBrandBar = () => {
  return (
    <div className="top-brand-bar">
      <img src={gameLogo} alt="Game logo" className="brand-logo left" />
      <img src={companyLogo} alt="Company logo" className="brand-logo right" />
    </div>
  );
};

export default TopBrandBar;

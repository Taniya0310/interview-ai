import { Lottie } from "lottie-react";
import loadingAnimation from "../../assets/loading.json";

export default function PageLoader() {
  return (
    <div
      className="page-loader"
      role="status"
      aria-label="Loading"
    >
      <Lottie
        animationData={loadingAnimation}
        loop
        autoplay
        className="page-loader-animation"
      />
    </div>
  );
}
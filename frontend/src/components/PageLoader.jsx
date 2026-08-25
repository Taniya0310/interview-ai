import { useEffect, useRef } from "react";
import lottie from "lottie-web";

export default function PageLoader() {
  const containerRef = useRef(null);

  useEffect(() => {
    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/loading.json",
    });

    return () => {
      animation.destroy();
    };
  }, []);

  return (
    <div className="page-loader">
      <div
        ref={containerRef}
        className="page-loader-animation"
      />
    </div>
  );
}
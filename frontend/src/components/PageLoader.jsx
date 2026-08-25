import { useEffect, useState } from "react";
import { Lottie } from "lottie-react";

export default function PageLoader() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/loading.json")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load animation");
        return response.json();
      })
      .then((data) => {
        if (active) setAnimationData(data);
      })
      .catch(() => {
        // Keep the loader usable if the animation asset cannot be fetched.
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-loader" role="status" aria-label="Loading">
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop
          autoplay
          className="page-loader-animation"
        />
      ) : (
        <div className="page-loader-spinner" />
      )}
    </div>
  );
}

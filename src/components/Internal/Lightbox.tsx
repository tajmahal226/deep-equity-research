"use client";

type Props = {
  /** Array of image sources to display. */
  data: ImageSource[];
};

/**
 * Lightbox component.
 * Displays a grid of images.
 *
 * @param props - The component props.
 * @returns The lightbox component.
 */
function Lightbox(props: Props) {
  const { data = [] } = props;

  return (
    <>
      <div className="flex flex-wrap gap-3 max-lg:gap-2">
        {data.map((item, idx) => {
          return (
            <picture
              key={idx}
              className="h-44 w-44 mt-0 mb-0 max-lg:h-40 max-lg:w-40 max-sm:w-36 max-sm:h-36"
            >
              <img
                className="h-full w-full rounded object-cover block"
                src={item.url}
                title={item.description}
                alt={item.description}
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
              />
            </picture>
          );
        })}
      </div>
    </>
  );
}

export default Lightbox;

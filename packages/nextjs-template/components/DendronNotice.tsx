import { ReactNode } from "react";
import { useToggle } from "../hooks/useToggle";

export const DendronNotice = ({
  show = false,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) => {
  const [val, toggle] = useToggle(show);
  return (
    <>
      {val && (
        <div className="notice">
          <div className="notice-content">{children}</div>
          <div
            className="notice-close"
            tabIndex={-1}
            aria-hidden
            onClick={() => {
              toggle();
            }}
          >
            x
          </div>
        </div>
      )}
      <style jsx>{`
        .notice {
          top: 0;
          width: 100%;
          background-color: #f5f7f9;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #d4dadf;
        }
        .notice-close {
          margin: 0.25em 1em;
          padding: 0 0.5em;
          cursor: pointer;
          user-select: none;
          border-radius: 30%;
          justify-content: center;
          align-items: center;
          display: flex;
          color: #8a8f99;
          background-color: #d4dadf;
        }
        .notice-content {
          color: #333;
        }
      `}</style>
    </>
  );
};

export default DendronNotice;

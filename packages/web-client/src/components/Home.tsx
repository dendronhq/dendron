import { DendronEditor } from "../editor/DendronEditor";
import React from "react";
import styled from "styled-components";

const WindowStyle = styled.div`
  margin: auto;
  min-width: 480px;
  padding: 10px;
`;

export function HomeComp() {
  return (
    <WindowStyle>
      <DendronEditor />
    </WindowStyle>
  );
}

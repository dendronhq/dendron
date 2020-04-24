import React from "react";
import styled from "styled-components";

const CenterStyle = styled.div`
  margin: auto;
  min-width: 480px;
  width: 50%;
  padding: 10px;
  padding-top: 15%;
  text-align: center;
`;

export function HomeComp() {
  return (
    <CenterStyle>
      <h1 style={{}}>Alphacortex </h1>
    </CenterStyle>
  );
}

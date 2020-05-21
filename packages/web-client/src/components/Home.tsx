import { userActions, userReducer } from "../redux/reducers/userReducer";

import { AppDispatch } from "../App";
import { Auth } from "@aws-amplify/auth";
import { Logger } from "@aws-amplify/core";
import React from "react";
import { Redirect } from "react-router-dom";
import { ReduxState } from "../redux/reducers";
import { connect } from "react-redux";
import styled from "styled-components";

const { setAuthState } = userActions;

const logger = new Logger("Home");

const mapStateToProps = (state: ReduxState) => ({
  value: state.sampleReducer.value,
  loadingState: state.loadingReducer,
  userState: state.userReducer,
});

type HomeOwnProps = {};

type HomeProps = ReturnType<typeof mapStateToProps> & {
  dispatch: AppDispatch;
} & HomeOwnProps;

const WindowStyle = styled.div`
  margin: auto;
  min-width: 480px;
  padding: 10px;
`;

// const Home = observer(({ auth }: Props) => {
//   if (auth.authenticated) return <Redirect to="/home" />;
//   auth.logout(true);
//   return null;
// });

export class Home extends React.PureComponent<HomeProps> {
  constructor(props: HomeProps) {
    super(props);
    Auth.currentAuthenticatedUser().then(
      (user) => {
        logger.info({ user });
        // optimization because all child components check for a user object
        // fetch here first
        this.props.dispatch(setAuthState({ authState: "signedIn" }));
      },
      (err) => {
        logger.info({ status: "no user" });
      }
    );
  }

  render() {
    const { userState } = this.props;
    if (userState.authState == "signedIn") {
      return <Redirect to="/test1" />;
    } else {
      return <div>Redirect Landing</div>;
    }
  }
}

// export function HomeComp() {
//   return <WindowStyle>Loading...</WindowStyle>;
// }

export default connect(mapStateToProps, null, null, {
  forwardRef: true,
})(Home);

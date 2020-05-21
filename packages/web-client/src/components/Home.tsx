import { Auth } from "@aws-amplify/auth";
import React from "react";
import { ReduxState } from "../redux/reducers";
import { connect } from "react-redux";
import styled from "styled-components";

const mapStateToProps = (state: ReduxState) => ({
  value: state.sampleReducer.value,
  loadingState: state.loadingReducer,
  userState: state.userReducer,
});
type ReduxCompProps = ReturnType<typeof mapStateToProps>;

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

export class Home extends React.PureComponent<ReduxCompProps> {
  render() {
    const { loadingState, userState } = this.props;
    // if (loadingState.FETCHING_INIT) {
    //   return "Loading...";
    // }
    if (userState.authState == "signedIn") {
      return <div>Signed In</div>;
    } else {
      return <div>Landing Page</div>;
    }
  }
}

// export function HomeComp() {
//   return <WindowStyle>Loading...</WindowStyle>;
// }

export default connect(mapStateToProps, null, null, {
  forwardRef: true,
})(Home);

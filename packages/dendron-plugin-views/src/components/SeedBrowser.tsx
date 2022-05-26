import { SeedConfig, SEED_REGISTRY } from "@dendronhq/common-all";
import { Avatar, Card, Layout, List, PageHeader } from "antd";
import _ from "lodash";
import seedStyles from "../styles/scss/seeds.module.scss";
import { DendronComponent } from "../types";
import { AddToWorkspaceButton, GoToSiteButton } from "./Seeds";

const SeedBrowser: DendronComponent = (props) => {
  const { ide, workspace } = props;
  const { browser } = workspace;
  const seedDataToRender = _.values(SEED_REGISTRY).map((data) => {
    if (data) {
      let payload: SeedConfig & { seedInWorkspace: boolean } = {
        ...data,
        seedInWorkspace: false,
      };
      if (_.includes(ide.seedsInWorkspace, data?.id)) {
        payload = {
          ...payload,
          seedInWorkspace: true,
        };
      }
      return payload;
    }
    return undefined;
  });

  const { Meta } = Card;
  const { Content } = Layout;

  return (
    <>
      <Layout className={seedStyles.layout}>
        <Content style={{ padding: "0 50px" }}>
          <div className={seedStyles.contentDiv}>
            <PageHeader
              className={seedStyles.siteHeader}
              title="Dendron Seed Registry"
              subTitle="Add Knowledge Bases to your Workspace"
            />
            <div className={seedStyles.listDiv}>
              <List
                grid={{
                  gutter: 24,
                  xs: 1,
                  sm: 2,
                  md: 3,
                  lg: 3,
                  xl: 4,
                  xxl: 4,
                }}
                dataSource={seedDataToRender}
                renderItem={(item) => (
                  <List.Item>
                    <Card
                      className={seedStyles.card}
                      hoverable
                      actions={[
                        <GoToSiteButton
                          url={item!.site ? item!.site.url : undefined}
                          inVscode={!browser}
                        />,
                        <AddToWorkspaceButton
                          seedId={item?.id!}
                          existsInWorkspace={
                            item ? item.seedInWorkspace : false
                          }
                        />,
                      ]}
                    >
                      <Meta
                        className={seedStyles.cardMeta}
                        avatar={
                          <Avatar
                            src={
                              item?.assets
                                ? item.assets.publisherLogo
                                : undefined
                            }
                          />
                        }
                        title={item!.name}
                        description={item!.description}
                      />
                    </Card>
                  </List.Item>
                )}
              />
            </div>
          </div>
        </Content>
      </Layout>
    </>
  );
};

export default SeedBrowser;

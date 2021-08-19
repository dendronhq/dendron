import {
  SeedConfig,
  SeedRegistryDict,
  SEED_REGISTRY,
} from "@dendronhq/common-all";
import { Avatar, Button, Card, Layout, List, PageHeader } from "antd";
import _ from "lodash";
import React from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { AddToWorkspaceButton, GoToSiteButton } from "../../components/seeds";
import { DendronProps, WorkspaceProps } from "../../lib/types";
import seedStyles from "../../styles/scss/seeds.module.scss";

export default function SeedBrowser({
  ide,
  seedRegistryData,
  browser,
}: DendronProps & { seedRegistryData: SeedRegistryDict } & WorkspaceProps) {
  const { switcher, themes, currentTheme, status } = useThemeSwitcher();
  const [_isDarkMode, setIsDarkMode] = React.useState(false);

  if (status === "loading") {
    return <div>Loading styles...</div>;
  }

  const seedDataToRender = _.values(seedRegistryData).map((data) => {
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
  });

  const toggleDarkMode = () => {
    setIsDarkMode((previous) => {
      switcher({ theme: previous ? themes.light : themes.dark });
      return !previous;
    });
  };

  const { Meta } = Card;
  const { Footer, Content } = Layout;

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
        <Footer>
          <h4>Current theme: {currentTheme}</h4>
          <Button type="primary" onClick={toggleDarkMode}>
            Toggle Theme
          </Button>
        </Footer>
      </Layout>
    </>
  );
}

/**
 * Get Static Properties from Next.JS at build time. When Seed Browser and the
 * data backing it becomes a service, this can be changed to
 * getServerSideProps()
 * @returns
 */
export async function getStaticProps() {
  return {
    props: {
      seedRegistryData: SEED_REGISTRY,
    },
  };
}

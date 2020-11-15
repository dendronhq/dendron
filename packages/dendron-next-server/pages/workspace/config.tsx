import { DendronConfig } from "@dendronhq/common-all";
import { Space, Input as AntInput } from "antd";
import { Formik } from "formik";
import {
  Form,
  Input,
  InputNumber,
  Checkbox,
  Switch,
  ResetButton,
  SubmitButton,
} from "formik-antd";
import { Fragment } from "react";

const getConfigData = (): { data: DendronConfig } => {
  return {
    data: {
      vaults: [
        //  type DVault = {
        //    name?: string;
        //    fsPath: string;
        //  };

        {
          fsPath: "vault",
        },
      ],
      site: {
        /**
         * If set, add prefix to all asset links
         */
        // assetsPrefix?: string;

        /**
         * Copy assets from vault to site.
         * Default: true
         */
        // copyAssets?: boolean;

        /**
         * By default, the domain of your `siteHiearchies` page
         */
        // siteIndex?: string;

        /**
         * Hiearchies to publish
         */
        siteHierarchies: ["dendron"],
        // siteHierarchies: string[];

        /**
         * Where your site will be published.
         * Relative to Dendron workspace
         */
        siteRootDir: "docs",
        // siteRootDir: string;

        /**
         * Location of the github repo where your site notes are located.
         * By default, this is assumed to be your `workspaceRoot` if not set.
         */
        // siteRepoDir?: string;

        /**
         * Folder where your notes will be kept. By default, "notes"
         */
        // siteNotesDir?: string;

        /** TODO */
        // usePrettyRefs?: boolean;

        /**
         * Control publication on a per hierarchy basis
         */
        // config?: { [key: string]: HierarchyConfig };
      },
    },
  };
};

const saveConfigData = (data: DendronConfig) => {
  console.log("data saved");
  console.log(JSON.stringify(data, null, 2));
};

const formLayout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

const submitButtonsLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

const VRHYTHM = 8;

export default function ConfigSamplePage() {
  const { data: configData } = getConfigData();

  return (
    <div style={{ maxWidth: "80ch" }}>
      <pre>{JSON.stringify(configData, null, 2)}</pre>

      <br />
      <br />
      <br />

      <h1>Config Data</h1>

      <Formik
        initialValues={configData}
        onSubmit={(formValues) => saveConfigData(formValues)}
      >
        <Form {...formLayout} onChange={console.log}>
          <fieldset>
            <legend>Vaults</legend>

            {configData.vaults.map((vault, index) => (
              <Fragment key={`vault-${index}`}>
                <Form.Item
                  //
                  name={`vaults[${index}].fsPath`}
                  label={`Vault ${index + 1}`} // Normies start counting from 1
                  help="Filesystem path to this vault."
                  style={{ marginTop: VRHYTHM }}
                >
                  <AntInput.Group compact>
                    <Input
                      //
                      name={`vaults[${index}].fsPath`}
                      placeholder="./filesystemPath"
                      required
                      style={{ width: "50%" }}
                    />

                    <Input
                      //
                      name={`vaults[${index}].name`}
                      placeholder="name (optional)"
                      style={{ width: "50%" }}
                    />
                  </AntInput.Group>
                </Form.Item>
              </Fragment>
            ))}
          </fieldset>

          <fieldset>
            <legend>Site</legend>

            <Form.Item
              //
              name="site.siteRootDir"
              label="Site root directory"
              help="Where your site will be published. Relative to Dendron workspace."
              style={{ marginTop: VRHYTHM }}
            >
              <Input
                //
                name="site.siteRootDir"
                placeholder="./docs"
                required
              />
            </Form.Item>

            <Form.Item
              //
              name="site.siteNotesDir"
              label="Site notes directory"
              help={`Folder where your notes will be kept. By default, "notes"`}
              style={{ marginTop: VRHYTHM }}
            >
              <Input
                //
                name="site.siteNotesDir"
                placeholder="./notes"
              />
            </Form.Item>

            <Form.Item
              //
              name="site.assetsPrefix"
              label="Assets prefix"
              help={`If set, add prefix to all asset links`}
              style={{ marginTop: VRHYTHM }}
            >
              <Input
                //
                name="site.assetsPrefix"
                placeholder="/static/"
              />
            </Form.Item>

            <Form.Item
              //
              name="site.siteIndex"
              label="Site index"
              help="By default, the domain of your `siteHiearchies` page"
              style={{ marginTop: VRHYTHM }}
            >
              <Input
                //
                name="site.siteIndex"
                placeholder={configData.site.siteHierarchies[0]}
              />
            </Form.Item>

            <Form.Item
              //
              name="site.siteRepoDir"
              label="Site repo directory"
              help="Location of the github repo where your site notes are located. By default, this is assumed to be your `workspaceRoot` if not set."
              style={{ marginTop: VRHYTHM }}
            >
              <Input
                //
                name="site.siteRepoDir"
                placeholder="./ (workspace root)"
              />
            </Form.Item>

            <Form.Item
              //
              name="site.usePrettyRefs"
              label="Use pretty refs?"
              help="(explain what pretty refs are)"
              style={{ marginTop: VRHYTHM }}
            >
              <Switch
                //
                name="site.usePrettyRefs"
              />
            </Form.Item>

            <Form.Item
              //
              name="site.copyAssets"
              label="Copy assets?"
              help={`Copy assets from vault to site?`}
              style={{ marginTop: VRHYTHM }}
            >
              <Switch
                //
                name="site.copyAssets"
              />
            </Form.Item>

            <fieldset>
              <legend>Site hierarchies</legend>

              {configData.site.siteHierarchies.map((hierarchy, index) => (
                <Fragment key={`hierarchy-${index}`}>
                  <Form.Item
                    //
                    name={`siteHierarchies[${index}]`}
                    label={`Hierarchy ${index + 1}`} // Normies start counting from 1
                    help="A hierarchy to publish"
                    style={{ marginTop: VRHYTHM }}
                  >
                    <Input
                      //
                      name={`siteHierarchies[${index}]`}
                      placeholder="(TODO)"
                      required
                    />
                  </Form.Item>
                </Fragment>
              ))}
            </fieldset>

            {/* TODO: config */}
          </fieldset>

          <Form.Item
            //
            {...submitButtonsLayout}
            name="submit" // satisfy the type gods
            style={{ marginTop: VRHYTHM * 4 }}
          >
            <Space>
              <ResetButton>Reset</ResetButton>

              <SubmitButton>Submit</SubmitButton>
            </Space>
          </Form.Item>
        </Form>
      </Formik>
    </div>
  );
}

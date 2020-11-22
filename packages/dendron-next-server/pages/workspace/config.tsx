import { DendronConfig } from "@dendronhq/common-all";
import { Formik, Field, Form } from "formik";
import React, { ReactNode, useState } from "react";
import {
  Box,
  Button,
  Code,
  Container,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Stack,
  Switch,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { get } from "lodash";
import Head from "next/head";

const getConfigData = (): { data: DendronConfig } => {
  return {
    data: {
      vaults: [
        {
          fsPath: "vault",
          name: "",
        },
      ],
      site: {
        assetsPrefix: "",
        copyAssets: false,
        siteHierarchies: ["dendron"],
        siteNotesDir: "",
        siteRepoDir: "",
        siteRootDir: "docs",
        usePrettyRefs: false,
      },
    },
  };
};

// const saveConfigData = (data: DendronConfig) => {
//   console.log("data saved");
//   console.log(JSON.stringify(data, null, 2));
// };

type InputControlProps = {
  name: string;
  label?: string;
  placeholder: string;
  help: string | ReactNode;
  disabled?: boolean;
  required?: boolean;
};

function InputControl({
  name,
  label,
  placeholder,
  help,
  disabled,
  required,
}: InputControlProps) {
  return (
    <Field name={name}>
      {({ form: { errors, touched } }) => (
        <FormControl
          isInvalid={
            /**
             * If field has errors AND they've interacted with this field, mark
             * control as invalid. */
            !!(get(errors, name) && get(touched, name))
          }
        >
          {!!label && <FormLabel htmlFor={name}>{label}</FormLabel>}

          <Field
            //
            as={Input}
            name={name}
            placeholder={placeholder}
            id={name}
            disabled={disabled}
            required={required}
          />

          <FormErrorMessage>{errors.site?.siteRootDir}</FormErrorMessage>

          <FormHelperText>{help}</FormHelperText>
        </FormControl>
      )}
    </Field>
  );
}

const PAGE_TITLE = "Dendron config editor";

export default function ConfigSamplePage() {
  // const { data: configData } = getConfigData();

  const [configData, saveConfigData] = useState(getConfigData().data);

  React.useEffect(() => {
    console.log("save", JSON.stringify(configData, null, 2));
  }, [JSON.stringify(configData)]);

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>

      <Container paddingBottom={12}>
        <Stack spacing={4}>
          <Heading>{PAGE_TITLE}</Heading>

          <Formik
            enableReinitialize
            initialValues={configData}
            onSubmit={(formValues) => saveConfigData(formValues)}
          >
            {({
              touched,
              errors,
              values,
              resetForm, // NOTE only works on fields which have configData keys
            }) => (
              <Box as={Form} onChange={console.log}>
                <Stack spacing={8}>
                  <Box as="fieldset">
                    <Heading size="md" as="legend">
                      Vaults
                    </Heading>

                    <Stack spacing={4}>
                      {configData.vaults.map((vault, index) => (
                        <Tooltip
                          label="Vaults are not yet editable via this form."
                          placement="top"
                          hasArrow
                        >
                          <Stack direction="row" spacing={2}>
                            <FormLabel
                              htmlFor={`vaults[${index}].fsPath`}
                              whiteSpace="nowrap"
                              paddingTop={2} // align with text field
                            >
                              Vault {index}
                            </FormLabel>

                            <InputControl
                              name={`vaults[${index}].fsPath`}
                              placeholder="./filesystemPath"
                              help="Vault location"
                              disabled
                            />

                            <InputControl
                              name={`vaults[${index}].name`}
                              placeholder="name"
                              help="Vault name"
                              disabled
                            />
                          </Stack>
                        </Tooltip>
                      ))}
                    </Stack>
                  </Box>

                  <Box as="fieldset">
                    <Heading size="md" as="legend">
                      Site
                    </Heading>

                    <Stack spacing={4}>
                      <InputControl
                        label="Site root directory"
                        name="site.siteRootDir"
                        placeholder="./docs"
                        help="Where your site will be published. Relative to Dendron workspace."
                        required
                      />

                      <InputControl
                        label="Site notes directory"
                        name="site.siteNotesDir"
                        placeholder="./notes"
                        help={`Folder where your notes will be kept. By default, "notes"`}
                        required
                      />

                      <InputControl
                        label="Assets prefix"
                        name="site.assetsPrefix"
                        placeholder="/static/"
                        help="If set, add prefix to all asset links"
                      />

                      <InputControl
                        label="Site repo directory"
                        name="site.siteRepoDir"
                        placeholder="./ (workspace root)"
                        help={
                          <>
                            Location of the github repo where your site notes
                            are located. By default, this is assumed to be your{" "}
                            <Code>workspaceRoot</Code> if not set.
                          </>
                        }
                        required
                      />

                      <FormControl
                        isInvalid={
                          !!(
                            touched.site?.usePrettyRefs &&
                            errors.site?.usePrettyRefs
                          )
                        }
                      >
                        <Stack direction="row" align="center">
                          <FormLabel margin={0}>Use pretty refs?</FormLabel>

                          <Field name="site.usePrettyRefs">
                            {({ form: { setFieldValue }, field: { name } }) => (
                              <Switch
                                id={name}
                                name={name}
                                isChecked={values?.site?.usePrettyRefs}
                                onChange={(e) =>
                                  setFieldValue(name, e.target.checked)
                                }
                                colorScheme="positive"
                              />
                            )}
                          </Field>
                        </Stack>

                        <FormHelperText>
                          Pretty refs help you identify when content is embedded
                          from elsewhere and provide links back to the source.
                        </FormHelperText>
                      </FormControl>

                      <FormControl
                        isInvalid={
                          !!(
                            touched.site?.copyAssets && errors.site?.copyAssets
                          )
                        }
                      >
                        <Stack direction="row" align="center">
                          <FormLabel margin={0}>Copy assets?</FormLabel>

                          <Field name="site.copyAssets">
                            {({
                              form: { setFieldValue },
                              field: { name, value },
                            }) => (
                              <Switch
                                id={name}
                                name={name}
                                value={value}
                                isChecked={values?.site?.copyAssets}
                                onChange={(e) =>
                                  setFieldValue(name, e.target.checked)
                                }
                                colorScheme="positive"
                              />
                            )}
                          </Field>
                        </Stack>

                        <FormHelperText>
                          If enabled, assets will be copied from the vault to
                          the site.
                        </FormHelperText>
                      </FormControl>
                    </Stack>
                  </Box>

                  <Box as="fieldset">
                    <Heading size="md" as="legend">
                      Site hierarchies
                    </Heading>

                    <Stack spacing={4}>
                      {configData.site?.siteHierarchies?.map(
                        (hierarchy, index) => (
                          <Tooltip
                            label="Site hierarchies are not yet editable via this form."
                            placement="top"
                            hasArrow
                          >
                            <FormControl as={Stack} direction="row" spacing={2}>
                              <Text
                                htmlFor={`site.siteHierarchies[${index}]`}
                                whiteSpace="nowrap"
                                paddingTop={2} // align with text field
                              >
                                Hierarchy {index}
                              </Text>

                              <Box flexGrow={1}>
                                <InputControl
                                  name={`site.siteHierarchies[${index}]`}
                                  placeholder="dendron"
                                  help="A hierarchy to publish"
                                  disabled
                                />
                              </Box>
                            </FormControl>
                          </Tooltip>
                        )
                      )}
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={2} justify="end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => resetForm()}
                    >
                      Reset
                    </Button>

                    <Button type="submit" colorScheme="green">
                      Submit
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </Formik>
        </Stack>
      </Container>
    </>
  );
}

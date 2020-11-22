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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Link,
  useToast,
} from "@chakra-ui/react";
import { get } from "lodash";
import Head from "next/head";

// TODO Temporarily copied here from engine-server/src/config.ts to use default
// values for input placeholders.
const genDefaultConfig = (): DendronConfig => ({
  vaults: [],
  site: {
    copyAssets: true,
    siteHierarchies: ["root"],
    siteRootDir: "docs",
    usePrettyRefs: true,
  },
});

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
          isRequired={required}
          isDisabled={disabled}
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

  const toast = useToast();

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
            onSubmit={(formValues) => {
              saveConfigData(formValues);

              // TODO when plumbing this to real data, you'll want to ensure
              // that the rendered toast is relevant to the result of the
              // operation -- i.e. "success" vs "failed", and only rendered when
              // the operation is finished.
              toast({
                title: "Changes saved",
                description:
                  "Your Dendron configuration file has been successfully updated.",
                status: "success",
                duration: 5000,
                isClosable: true,
              });
            }}
          >
            {({
              touched,
              errors,
              values,
              resetForm, // NOTE only works on fields which have configData keys
              dirty,
            }) => (
              <Box as={Form} onChange={console.log}>
                <Stack spacing={8}>
                  <Box as="fieldset">
                    <Heading size="md" as="legend">
                      Site
                    </Heading>

                    <Stack spacing={4}>
                      <Popover trigger="hover" placement="top" gutter={-12}>
                        <PopoverTrigger>
                          {/* Superfluous box because Popover doesn't work on disabled Input */}
                          <Box>
                            <InputControl
                              label="Vault"
                              name={`vaults[0].fsPath`}
                              placeholder="./filesystemPath"
                              help="The vault's location on your filesystem."
                              disabled
                            />
                          </Box>
                        </PopoverTrigger>

                        <PopoverContent>
                          <PopoverArrow />

                          <PopoverBody>
                            You can update vaults using{" "}
                            <Link
                              href="https://dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f47.html#vault-add"
                              target="_blank"
                            >
                              Dendron Vault Commands
                            </Link>
                            .
                          </PopoverBody>
                        </PopoverContent>
                      </Popover>

                      <Popover trigger="hover" placement="top" gutter={-12}>
                        <PopoverTrigger>
                          {/* Superfluous box because Popover doesn't work on disabled Input */}
                          <Box>
                            <InputControl
                              label="Site hierarchy"
                              name="site.siteHierarchies[0]"
                              placeholder={
                                genDefaultConfig().site.siteHierarchies[0]
                              }
                              help="The hierarchy to publish."
                              disabled
                            />
                          </Box>
                        </PopoverTrigger>

                        <PopoverContent>
                          <PopoverArrow />

                          <PopoverBody>
                            You can configure published hierarchies{" "}
                            <Link
                              href="https://www.dendron.so/notes/ffa6a4ba-5eda-48c7-add5-8e2333ba27b4.html#sitehierarchies-str"
                              target="_blank"
                            >
                              in the configuration file
                            </Link>
                            .
                          </PopoverBody>
                        </PopoverContent>
                      </Popover>

                      <InputControl
                        label="Site root directory"
                        name="site.siteRootDir"
                        placeholder={genDefaultConfig().site.siteRootDir}
                        help="Where your site will be published. Relative to Dendron workspace."
                        required
                      />

                      <InputControl
                        label="Site notes directory"
                        name="site.siteNotesDir"
                        placeholder={genDefaultConfig().site.siteNotesDir}
                        help={`Folder where your notes will be kept. By default, "notes"`}
                        required
                      />

                      <InputControl
                        label="Assets prefix"
                        name="site.assetsPrefix"
                        placeholder={genDefaultConfig().site.assetsPrefix}
                        help="If set, add prefix to all asset links"
                      />

                      <InputControl
                        label="Site repo directory"
                        name="site.siteRepoDir"
                        placeholder={genDefaultConfig().site.siteRepoDir}
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
                          <Field name="site.usePrettyRefs">
                            {({ form: { setFieldValue }, field: { name } }) => (
                              <>
                                <FormLabel htmlFor={name} margin={0}>
                                  Use pretty refs?
                                </FormLabel>

                                <Switch
                                  id={name}
                                  name={name}
                                  isChecked={values?.site?.usePrettyRefs}
                                  onChange={(e) =>
                                    setFieldValue(name, e.target.checked)
                                  }
                                  colorScheme="positive"
                                />
                              </>
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
                          <Field name="site.copyAssets">
                            {({
                              form: { setFieldValue },
                              field: { name, value },
                            }) => (
                              <>
                                <FormLabel htmlFor={name} margin={0}>
                                  Copy assets?
                                </FormLabel>

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
                              </>
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

                  <Stack direction="row" spacing={2} justify="end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => resetForm()}
                      disabled={!dirty}
                    >
                      Clear changes
                    </Button>

                    <Button
                      type="submit"
                      variant={dirty ? "solid" : "outline"}
                      colorScheme={dirty ? "positive" : "gray"}
                    >
                      Save changes
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

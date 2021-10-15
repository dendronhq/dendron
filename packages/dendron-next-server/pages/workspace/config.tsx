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
  ListItem,
  OrderedList,
  Stack,
  Switch,
  useToast,
} from "@chakra-ui/react";
import {
  LegacyNoteAddBehavior,
  IntermediateDendronConfig,
  LegacyLookupSelectionType,
} from "@dendronhq/common-all";
import { Field, FieldArray, Form, Formik } from "formik";
import _, { get } from "lodash";
import Head from "next/head";
import React, { ReactNode } from "react";
import { configWrite } from "../../lib/effects";
import { useDendronConfig } from "../../lib/hooks";

// TODO Temporarily copied here from engine-server/src/config.ts to use default
// values for input placeholders.
const genDefaultConfig = (): IntermediateDendronConfig => ({
  version: 1,
  vaults: [],
  useFMTitle: true,
  useNoteTitleForLink: true,
  noAutoCreateOnDefinition: true,
  noLegacyNoteRef: true,
  noXVaultWikiLink: true,
  lookupConfirmVaultOnCreate: false,
  lookup: {
    note: {
      selectionType: LegacyLookupSelectionType.selectionExtract,
      leaveTrace: false,
    },
  },
  journal: {
    dailyDomain: "daily",
    name: "journal",
    dateFormat: "y.MM.dd",
    addBehavior: LegacyNoteAddBehavior.childOfDomain,
    firstDayOfWeek: 1,
  },
  scratch: {
    name: "scratch",
    dateFormat: "y.MM.dd.HHmmss",
    addBehavior: LegacyNoteAddBehavior.asOwnDomain,
  },
  site: {
    copyAssets: true,
    siteHierarchies: ["root"],
    siteRootDir: "docs",
    usePrettyRefs: true,
    title: "Dendron",
    description: "Personal knowledge space",
  },
});

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
      {
        // @ts-ignore
        ({ form: { errors, touched } }) => (
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
        )
      }
    </Field>
  );
}

const PAGE_TITLE = "Dendron Configuration";

const saveConfigData = async (config: IntermediateDendronConfig) => {
  console.log("saving", config);
  // FIXME: hack
  // empty string is different from undefined
  _.forEach(config.site, (v, k) => {
    if (_.isEmpty(v) && _.isString(v)) {
      // @ts-ignore
      delete config.site[k];
    }
  });
  await configWrite(config);
};

export default function ConfigSamplePage() {
  const toast = useToast();
  const { isError, config: configData, error } = useDendronConfig();
  if (isError) return <div>failed to load: {JSON.stringify(error)}</div>;
  if (!configData) return <div>loading...</div>;

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
              saveConfigData(formValues)
                .then(() => {
                  toast({
                    title: "Changes saved",
                    description:
                      "Your Dendron configuration file has been successfully updated.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                  });
                })
                .catch((err) => {
                  toast({
                    title: "Error saving",
                    description: JSON.stringify({
                      error: err.message,
                      stack: err.stack,
                    }),
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                  });
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
                      Site Config
                    </Heading>
                    <Stack spacing={4}>
                      <Box as="fieldset">
                        <FieldArray
                          name="site.siteHierarchies"
                          render={(arrayHelpers) => (
                            <OrderedList>
                              {values.site.siteHierarchies.map((_ent, idx) => (
                                <ListItem>
                                  <Field
                                    as={Input}
                                    key={idx}
                                    name={`site.siteHierarchies.${idx}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => arrayHelpers.remove(idx)}
                                  >
                                    -
                                  </button>
                                </ListItem>
                              ))}
                              <button
                                type="button"
                                onClick={() => arrayHelpers.push("")}
                              >
                                +
                              </button>
                            </OrderedList>
                          )}
                        />
                      </Box>
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
                        placeholder={genDefaultConfig().site.siteNotesDir!}
                        help={`Folder where your notes will be kept. By default, "notes"`}
                      />

                      <InputControl
                        label="Assets prefix"
                        name="site.assetsPrefix"
                        placeholder={genDefaultConfig().site.assetsPrefix!}
                        help="If set, add prefix to all asset links"
                      />

                      <InputControl
                        label="Site repo directory"
                        name="site.siteRepoDir"
                        placeholder={genDefaultConfig().site.siteRepoDir!}
                        help={
                          <>
                            Location of the github repo where your site notes
                            are located. By default, this is assumed to be your{" "}
                            <Code>workspaceRoot</Code> if not set.
                          </>
                        }
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
                            {({
                              // @ts-ignore
                              form: { setFieldValue },
                              // @ts-ignore
                              field: { name },
                            }) => (
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
                              // @ts-ignore
                              form: { setFieldValue },
                              // @ts-ignore
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

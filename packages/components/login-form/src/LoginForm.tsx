import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Field,
  type FieldProps,
  Form,
  Formik,
  type FormikHelpers,
} from "formik";
import { HiEye, HiEyeOff } from "react-icons/hi";

interface LoginFormProps {
  onLogin: OnLogin;
}

export type OnLogin = (value: FormValue) => Promise<void>;

export interface FormValue {
  email: string;
  password: string;
}

const initialValues: FormValue = {
  email: "",
  password: "",
};

export default function LoginForm({ onLogin }: LoginFormProps): JSX.Element {
  const { isOpen, onToggle } = useDisclosure();

  // eslint-disable-next-line consistent-return
  const validateEmail = (email?: string) => {
    if (!email) {
      return "Email is required";
    }

    if (!email.includes("@")) {
      return "Email must be a valid format";
    }
  };

  // eslint-disable-next-line consistent-return
  const validatePassword = (password?: string) => {
    if (!password) {
      return "Password is required";
    }

    if (password.length < 6) {
      return "Password requires 6 or more characters";
    }
  };

  const handleOnSubmit = (
    value: FormValue,
    actions: FormikHelpers<FormValue>
  ) => {
    onLogin(value);
    actions.setSubmitting(false);
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleOnSubmit}>
      {({ isSubmitting, isValid }) => (
        <Form>
          <Stack spacing="6">
            <Field name="email" validate={validateEmail}>
              {({ field, form }: FieldProps<string[], FormValue>) => (
                <FormControl
                  isInvalid={form.errors.email === "" && form.touched.email}
                >
                  <FormLabel htmlFor="email">Email address</FormLabel>
                  <Input
                    {...field}
                    autoComplete="email"
                    id="email"
                    type="email"
                  />
                  <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="password" validate={validatePassword}>
              {({ field, form }: FieldProps<string[], FormValue>) => (
                <FormControl
                  isInvalid={
                    form.errors.password === "" && form.touched.password
                  }
                >
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <InputGroup>
                    <InputRightElement>
                      <IconButton
                        aria-label={
                          isOpen ? "Mask password" : "Reveal password"
                        }
                        bg="transparent !important"
                        icon={isOpen ? <HiEyeOff /> : <HiEye />}
                        onClick={onToggle}
                        variant="ghost"
                      />
                    </InputRightElement>
                    <Input
                      {...field}
                      autoComplete="current-password"
                      id="password"
                      type={isOpen ? "text" : "password"}
                    />
                  </InputGroup>
                  <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Button
              fontSize="md"
              isActive={isValid}
              isLoading={isSubmitting}
              size="lg"
              type="submit"
            >
              Sign in
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  );
}

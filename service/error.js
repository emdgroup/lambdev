class ServiceError extends Error {
  constructor(name, message, code) {
    super(message);
    this.name = name;
    this.statusCode = code;
  }

  description(message) {
    this.message = message;
    return this;
  }
}

const errors = {
  DockerUnavailable: new ServiceError(
    'DockerUnavailable',
    'The docker daemon is unavailable. Please make sure that the docker socket is mounted at /var/run/docker.sock.',
    400,
  ),
  InvalidParameterValue: new ServiceError(
    'InvalidParameterValue',
    'One of the parameters in the request is invalid.',
    400,
  ),
  CredentialsInvalid: new ServiceError(
    'CredentialsInvalid',
    'The provided credentials are invalid.',
    400,
  ),
  CredentialsUnavailable: new ServiceError(
    'InvalidCredentials',
    'Credentials could not be found. Please specify the AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_SESSION_TOKEN (for temporary credentials).',
    400,
  ),
};

module.exports = { ServiceError, errors };

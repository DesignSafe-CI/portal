"""
.. :module:: apps.accounts.managers.ssh_keys
   :synopsis: Manager handling anything pertaining to accounts
"""

import logging
import paramiko


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class KeyCannotBeAdded(Exception):
    """Key Cannot Be Added Exception

    Exception raised when there is an error adding a public key
    to `~/.ssh/authorized_keys`
    """

    def __init__(self, msg, output, error_output, *args, **kwargs):
        super(KeyCannotBeAdded, self).__init__(*args, **kwargs)
        self.msg = msg
        self.output = output
        self.error_output = error_output

    def __str__(self):
        return "{msg}: {output} \n {error}".format(
            msg=self.msg, output=self.output, error=self.error_output
        )


class KeysManager:
    # pylint: disable=too-few-public-methods
    """Keys Manager

    Class to wrap together any necessary action pertaining to ssh keys
    and remote resources.
    """

    def __init__(self, username, password, token):
        # pylint: disable=super-init-not-called
        """Init"""
        self.username = username
        self.password = password
        self.token = token

    def _tacc_prompt_handler(self, title, instructions, prompt_list):
        """TACC Prompt Handler

        This method handles SSH prompts from TACC resources
        """
        answers = {
            "password": self.password,
            "tacc_token_code": self.token,
            "tacc_token": self.token,
        }
        resp = []
        logger.debug("title: %s", title)
        logger.debug("instructions: %s", instructions)
        logger.debug("list: %s", prompt_list)
        for prmpt in prompt_list:
            prmpt_str = prmpt[0].lower().strip().replace(" ", "_").replace(":", "")
            resp.append(answers[prmpt_str])
        return resp

    def get_transport(self, hostname, port):
        """Gets authenticated transport"""
        handler = self._tacc_prompt_handler

        trans = paramiko.Transport((hostname, port))
        # trans.sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        # trans.set_hexdump(True)
        trans.use_compression()
        # trans.set_keepalive(5)
        trans.connect()
        trans.auth_interactive_dumb(self.username, handler)
        return trans

    def _get_pub_key_comment(self, system_id):
        """Get Pub Key Comment

        :param str system_id: Agave's system id

        :return str: comment
        """
        comment = "{username}@{system_id}".format(
            username=self.username, system_id=system_id
        )
        return comment

    def _get_add_pub_key_command(self, system_id, public_key):
        """Get Add Pub Key Command

        :param str system_id: Agave's system id
        :param str publick_key: Public Key

        :return str: command
        """
        comment = self._get_pub_key_comment(system_id)
        string = " ".join([public_key, comment])
        command = (
            'if [ ! -f "~/.ssh/authorized_keys" ]; then '
            "mkdir -p ~/.ssh/ && touch ~/.ssh/authorized_keys "
            "&& chmod 0600 ~/.ssh/authorized_keys; fi && "
            'grep -q -F "{string}" ~/.ssh/authorized_keys || '
            'echo "{string}" >> ~/.ssh/authorized_keys'
        ).format(string=string)
        return command

    def add_public_key(
        self, system_id, hostname, public_key, port=22, transport=None
    ):  # pylint: disable=too-many-arguments, arguments-differ
        """Adds public key to `authorized_keys`

        :param str sytem_id: System Id
        :param str hostname: Hostname
        :param str public_key: Public Key
        :param int port: Port (optional)
        :param transport: Transport object (optional)
        """
        if transport is None:
            trans = self.get_transport(hostname, port)
        else:
            trans = transport
        channel = trans.open_session()
        command = self._get_add_pub_key_command(system_id, public_key)
        channel.exec_command(command)
        # recv_exit_status blocks until there's an exit status from the
        # executed command.
        # So, after this we're safe to read stdout and stderr
        status = channel.recv_exit_status()
        output = channel.makefile()
        stderr = channel.makefile_stderr()
        output_lines = ""
        for line in output.readlines():
            output_lines += line + "\n"
            logger.debug(line)

        if status == -1:
            logger.info("No response from the server")
        elif status == 0:
            logger.info("Public key added successfully to {}".format(hostname))
        elif status > 0:
            error_lines = ""
            for line in stderr.readlines():
                error_lines += line + "\n"

            raise KeyCannotBeAdded("Error adding public key", output_lines, error_lines)
        trans.close()
        return output_lines

import logging
from django.core.management import BaseCommand, CommandError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    This command converts NCO TTC Grants dates to and from unix and string time.
    Unix time is used to sort the list of responses.
    String time is used for display.
    """

    help = "Reindex all files into a fresh index, then swap aliases with the current default index."

    def add_arguments(self, parser):
        parser.add_argument('--to-string', help='convert unix dates to strings', default="false")
        parser.add_arguement('--to-unix-date', help='convert string date to unix', default="true")

    def handle(self, *args, **options):
        logger.info('initial stuff')

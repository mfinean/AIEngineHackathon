import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)


def main():
    print("Direct print statement")
    logger.info("Test log message")
    logger.error("Test error message")


if __name__ == "__main__":
    main()

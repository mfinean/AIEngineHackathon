from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from dataclasses import dataclass
from typing import List, Optional, Dict
import time
import random
import os
import platform
import urllib.parse
import json
from datetime import datetime
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ShoppingItem:
    title: str
    price: str
    seller: str
    link: str
    image_url: str


class GoogleShoppingScraper:
    def __init__(self):
        try:
            logger.info("Setting up Chrome options...")
            chrome_options = Options()
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument(
                "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )

            # Mac-specific options
            if platform.system() == "Darwin":  # macOS
                chrome_options.add_argument("--disable-gpu")
                chrome_options.binary_location = (
                    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
                )

            logger.info("Installing ChromeDriver...")
            service = Service(ChromeDriverManager().install())

            logger.info("Initializing WebDriver...")
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.execute_cdp_cmd(
                "Network.setUserAgentOverride",
                {
                    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
            )
            self.driver.execute_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            logger.info("WebDriver initialized successfully")

            self.base_url = "https://www.google.co.uk/shopping"

        except Exception as e:
            logger.error(f"Failed to initialize scraper: {str(e)}")
            raise

    def __del__(self):
        try:
            if hasattr(self, "driver"):
                self.driver.quit()
                logger.info("WebDriver closed successfully")
        except Exception as e:
            logger.error(f"Error closing WebDriver: {str(e)}")

    def search(self, query: str, num_results: int = 10) -> List[ShoppingItem]:
        items = []
        try:
            logger.info(f"Preparing to search for: {query}")

            # Construct the direct shopping URL
            encoded_query = urllib.parse.quote(query)
            search_url = (
                f"{self.base_url}/search"
                f"?tbm=shop"  # Shopping tab
                f"&hl=en-GB"  # UK English
                f"&q={encoded_query}"  # Search query
            )

            logger.info(f"Navigating to: {search_url}")
            self.driver.get(search_url)

            # Random delay to appear more human-like
            time.sleep(random.uniform(2, 4))

            # Wait for any of these selectors to be present
            selectors = [
                "div.sh-dgr__content",
                "div.sh-dlr__list-result",
                "div.sh-pr__product-results",
                "div.KZmu8e",
            ]

            for selector in selectors:
                try:
                    WebDriverWait(self.driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    logger.info(f"Found results with selector: {selector}")
                    break
                except:
                    continue

            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            products = soup.find_all(
                "div", class_=["sh-dgr__content", "sh-dlr__list-result", "KZmu8e"]
            )

            for product in products[:num_results]:
                try:
                    title = product.find(
                        ["h3", "h4", "div"], class_=["tAxDx", "EI11Pd"]
                    )
                    price = product.find(["span", "div"], class_=["a8Pemb", "kHxwFf"])
                    merchant = product.find("div", class_=["aULzUe", "IuHnof"])
                    link = product.find("a", class_=["Lq5OHe", "eaGTj"])
                    image = product.find("img", class_=["TL92Hc", "sh-div__image"])

                    if not title:
                        logger.info(f"Skipping product - no title found")
                        continue

                    item = ShoppingItem(
                        title=title.text.strip() if title else "N/A",
                        price=price.text.strip() if price else "N/A",
                        seller=merchant.text.strip() if merchant else "N/A",
                        link=(
                            f"https://www.google.co.uk{link['href']}"
                            if link and "href" in link.attrs
                            else "N/A"
                        ),
                        image_url=(
                            image["src"] if image and "src" in image.attrs else "N/A"
                        ),
                    )

                    logger.info(f"Successfully parsed: {item.title[:50]}...")
                    items.append(item)

                except Exception as e:
                    logger.error(f"Error parsing product: {e}")
                    continue

            return items

        except Exception as e:
            logger.error(f"Error during search: {str(e)}")
            self.driver.save_screenshot("error.png")
            return []

    @classmethod
    def search_products(
        cls, query: str, num_results: int = 10, output_file: Optional[str] = None
    ) -> Dict:
        """
        Class method for easy programmatic usage
        """
        scraper = cls()
        results = scraper.search(query, num_results)

        output_data = {
            "search_query": query,
            "timestamp": datetime.now().isoformat(),
            "results": [
                {
                    "title": item.title,
                    "price": item.price,
                    "seller": item.seller,
                    "url": item.link,
                    "image_url": item.image_url,
                }
                for item in results
            ],
        }

        if output_file:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
                logger.info(f"\nResults saved to {output_file}")

        return output_data


def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description="Google Shopping Scraper")
    parser.add_argument(
        "query",
        nargs="?",
        default="brown men's leather jacket",
        help='Search query (default: "brown men\'s leather jacket")',
    )
    parser.add_argument(
        "-n",
        "--num-results",
        type=int,
        default=10,
        help="Number of results to return (default: 10)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        help="Output file name (default: shopping_results_TIMESTAMP.json)",
    )

    args = parser.parse_args()

    try:
        # Generate default output filename if none provided
        output_file = args.output
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"shopping_results_{timestamp}.json"

        # Use the class method
        results = GoogleShoppingScraper.search_products(
            query=args.query, num_results=args.num_results, output_file=output_file
        )

        # Print results to terminal
        logger.info("\nSearch Results:")
        for item in results["results"]:
            logger.info("\n-------------------")
            logger.info(f"Title: {item['title']}")
            logger.info(f"Price: {item['price']}")
            logger.info(f"Seller: {item['seller']}")
            logger.info(f"URL: {item['url']}")
            logger.info(f"Image URL: {item['image_url']}")

    except Exception as e:
        logger.error(f"Main execution error: {str(e)}")
        import traceback

        logger.error("Full traceback:")
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    main()

from flask import Flask, request, jsonify, render_template
import json
import math
import os

app = Flask(__name__)

# --------------------------------------------------
# Workora catalog file
# --------------------------------------------------

CATALOG_FILE = "live_filter_catalog (1).json"


# --------------------------------------------------
# Load catalog
# --------------------------------------------------

def load_catalog():

    if not os.path.exists(CATALOG_FILE):
        print("ERROR: Catalog file not found!")
        return []

    try:

        with open(
            CATALOG_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

        print(f"Catalog loaded successfully: {len(data)} records")

        return data

    except Exception as error:

        print("Error loading catalog:", error)

        return []


catalog = load_catalog()


# --------------------------------------------------
# Home page
# --------------------------------------------------

@app.route("/")
def home():

    return render_template("index.html")


# --------------------------------------------------
# Search API
# --------------------------------------------------

@app.route("/api/search")
def search():

    # Search text
    search_text = request.args.get(
        "search",
        ""
    ).strip().lower()


    # Category filter
    category_text = request.args.get(
        "category",
        ""
    ).strip()


    # Page
    try:

        page = int(
            request.args.get(
                "page",
                1
            )
        )

    except ValueError:

        page = 1


    # Limit
    try:

        limit = int(
            request.args.get(
                "limit",
                10
            )
        )

    except ValueError:

        limit = 10


    # Make sure page and limit are valid

    if page < 1:
        page = 1

    if limit < 1:
        limit = 10


    # --------------------------------------------------
    # Search filtering
    # --------------------------------------------------

    filtered_data = catalog


    if search_text:

        filtered_data = [

            item

            for item in filtered_data

            if search_text in (
                str(item.get("title", "")) + " " +
                str(item.get("category", "")) + " " +
                str(item.get("level", "")) + " " +
                str(item.get("durationMinutes", "")) + " " +
                str(item.get("rating", ""))
            ).lower()

        ]


    # --------------------------------------------------
    # Category filtering
    # --------------------------------------------------

    if category_text:

        selected_categories = [

            category.strip().lower()

            for category in category_text.split(",")

            if category.strip()

        ]


        if selected_categories:

            filtered_data = [

                item

                for item in filtered_data

                if str(
                    item.get("category", "")
                ).strip().lower()
                in selected_categories

            ]


    # --------------------------------------------------
    # Pagination
    # --------------------------------------------------

    total_results = len(filtered_data)


    if total_results == 0:

        total_pages = 0
        results = []

    else:

        total_pages = math.ceil(
            total_results / limit
        )


        # Prevent invalid page

        if page > total_pages:

            page = total_pages


        start = (page - 1) * limit

        end = start + limit

        results = filtered_data[start:end]


    # --------------------------------------------------
    # API response
    # --------------------------------------------------

    return jsonify({

        "results": results,

        "page": page,

        "limit": limit,

        "total_results": total_results,

        "total_pages": total_pages

    })


# --------------------------------------------------
# Categories API
# --------------------------------------------------

@app.route("/api/categories")
def categories():

    categories = sorted(

        set(

            str(
                item.get("category", "")
            ).strip()

            for item in catalog

            if str(
                item.get("category", "")
            ).strip()

        )

    )


    return jsonify({

        "categories": categories

    })


# --------------------------------------------------
# Run Flask application
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=True
    )
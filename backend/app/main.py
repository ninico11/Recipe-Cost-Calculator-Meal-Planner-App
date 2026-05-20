from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .database import get_connection, init_db
from .schemas import (
    Ingredient,
    IngredientCreate,
    IngredientUpdate,
    MealPlanCreate,
    MealPlanEntry,
    Recipe,
    RecipeCreate,
    RecipeIngredient,
)


app = FastAPI(title="Recipe Cost Calculator & Meal Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.get("/ingredients", response_model=List[Ingredient])
def list_ingredients() -> List[Ingredient]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, name, quantity, unit, price FROM ingredients ORDER BY name"
        ).fetchall()
    return [Ingredient(**dict(row)) for row in rows]


@app.post("/ingredients", response_model=Ingredient, status_code=201)
def create_ingredient(payload: IngredientCreate) -> Ingredient:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO ingredients (name, quantity, unit, price)
            VALUES (?, ?, ?, ?)
            """,
            (payload.name.strip(), payload.quantity, payload.unit.strip(), payload.price),
        )
        ingredient_id = cursor.lastrowid
        row = connection.execute(
            "SELECT id, name, quantity, unit, price FROM ingredients WHERE id = ?",
            (ingredient_id,),
        ).fetchone()
    return Ingredient(**dict(row))


@app.put("/ingredients/{ingredient_id}", response_model=Ingredient)
def update_ingredient(ingredient_id: int, payload: IngredientUpdate) -> Ingredient:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE ingredients
            SET name = ?, quantity = ?, unit = ?, price = ?
            WHERE id = ?
            """,
            (
                payload.name.strip(),
                payload.quantity,
                payload.unit.strip(),
                payload.price,
                ingredient_id,
            ),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Ingredient not found")

        row = connection.execute(
            "SELECT id, name, quantity, unit, price FROM ingredients WHERE id = ?",
            (ingredient_id,),
        ).fetchone()
    return Ingredient(**dict(row))


@app.delete("/ingredients/{ingredient_id}", status_code=204)
def delete_ingredient(ingredient_id: int) -> None:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM ingredients WHERE id = ?",
            (ingredient_id,),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Ingredient not found")


def build_recipe(recipe_id: int) -> Recipe:
    with get_connection() as connection:
        recipe_row = connection.execute(
            "SELECT id, name, servings FROM recipes WHERE id = ?",
            (recipe_id,),
        ).fetchone()
        if recipe_row is None:
            raise HTTPException(status_code=404, detail="Recipe not found")

        ingredient_rows = connection.execute(
            """
            SELECT
                ri.ingredient_id,
                i.name AS ingredient_name,
                ri.quantity,
                i.unit,
                i.price / i.quantity AS unit_price
            FROM recipe_ingredients ri
            JOIN ingredients i ON i.id = ri.ingredient_id
            WHERE ri.recipe_id = ?
            ORDER BY i.name
            """,
            (recipe_id,),
        ).fetchall()

    ingredients = []
    total_cost = 0.0
    for row in ingredient_rows:
        estimated_cost = round(row["quantity"] * row["unit_price"], 2)
        total_cost += estimated_cost
        ingredients.append(
            RecipeIngredient(
                ingredient_id=row["ingredient_id"],
                ingredient_name=row["ingredient_name"],
                quantity=row["quantity"],
                unit=row["unit"],
                unit_price=round(row["unit_price"], 4),
                estimated_cost=estimated_cost,
            )
        )

    servings = recipe_row["servings"]
    total_cost = round(total_cost, 2)
    return Recipe(
        id=recipe_row["id"],
        name=recipe_row["name"],
        servings=servings,
        total_cost=total_cost,
        cost_per_serving=round(total_cost / servings, 2),
        ingredients=ingredients,
    )


@app.get("/recipes", response_model=List[Recipe])
def list_recipes() -> List[Recipe]:
    with get_connection() as connection:
        rows = connection.execute("SELECT id FROM recipes ORDER BY name").fetchall()
    return [build_recipe(row["id"]) for row in rows]


@app.post("/recipes", response_model=Recipe, status_code=201)
def create_recipe(payload: RecipeCreate) -> Recipe:
    combined_ingredients = {}
    for item in payload.ingredients:
        combined_ingredients[item.ingredient_id] = combined_ingredients.get(item.ingredient_id, 0) + item.quantity

    ingredient_ids = list(combined_ingredients.keys())
    if not ingredient_ids:
        raise HTTPException(status_code=400, detail="Recipe must include ingredients")

    with get_connection() as connection:
        existing_rows = connection.execute(
            f"""
            SELECT id FROM ingredients
            WHERE id IN ({",".join("?" for _ in ingredient_ids)})
            """,
            ingredient_ids,
        ).fetchall()
        if len(existing_rows) != len(set(ingredient_ids)):
            raise HTTPException(status_code=400, detail="One or more ingredients do not exist")

        cursor = connection.execute(
            "INSERT INTO recipes (name, servings) VALUES (?, ?)",
            (payload.name.strip(), payload.servings),
        )
        recipe_id = cursor.lastrowid
        connection.executemany(
            """
            INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
            VALUES (?, ?, ?)
            """,
            [(recipe_id, ingredient_id, quantity) for ingredient_id, quantity in combined_ingredients.items()],
        )

    return build_recipe(recipe_id)


@app.get("/recipes/{recipe_id}/cost", response_model=Recipe)
def get_recipe_cost(recipe_id: int) -> Recipe:
    return build_recipe(recipe_id)


@app.get("/meal-plan", response_model=List[MealPlanEntry])
def list_meal_plan() -> List[MealPlanEntry]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT mp.day_of_week, r.id AS recipe_id
            FROM meal_plan mp
            JOIN recipes r ON r.id = mp.recipe_id
            """
        ).fetchall()

    recipes = {row["day_of_week"]: build_recipe(row["recipe_id"]) for row in rows}
    entries = [
        MealPlanEntry(
            day_of_week=day,
            recipe_id=recipe.id,
            recipe_name=recipe.name,
            total_cost=recipe.total_cost,
            cost_per_serving=recipe.cost_per_serving,
        )
        for day in DAY_ORDER
        if (recipe := recipes.get(day)) is not None
    ]
    return entries


@app.post("/meal-plan", response_model=MealPlanEntry, status_code=201)
def upsert_meal_plan(payload: MealPlanCreate) -> MealPlanEntry:
    normalized_day = payload.day_of_week.strip().title()
    if normalized_day not in DAY_ORDER:
        raise HTTPException(status_code=400, detail="Day must be a valid weekday in English")

    recipe = build_recipe(payload.recipe_id)

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO meal_plan (day_of_week, recipe_id)
            VALUES (?, ?)
            ON CONFLICT(day_of_week) DO UPDATE SET recipe_id = excluded.recipe_id
            """,
            (normalized_day, payload.recipe_id),
        )

    return MealPlanEntry(
        day_of_week=normalized_day,
        recipe_id=recipe.id,
        recipe_name=recipe.name,
        total_cost=recipe.total_cost,
        cost_per_serving=recipe.cost_per_serving,
    )


@app.get("/meal-plan/weekly-cost")
def get_weekly_cost() -> dict:
    entries = list_meal_plan()
    total = round(sum(entry.total_cost for entry in entries), 2)
    return {"weekly_total_cost": total}

from typing import List

from pydantic import BaseModel, Field


class IngredientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    quantity: float = Field(gt=0)
    unit: str = Field(min_length=1, max_length=30)
    price: float = Field(ge=0)


class IngredientUpdate(IngredientCreate):
    pass


class Ingredient(IngredientCreate):
    id: int


class RecipeIngredientInput(BaseModel):
    ingredient_id: int
    quantity: float = Field(gt=0)


class RecipeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    servings: int = Field(gt=0)
    ingredients: List[RecipeIngredientInput] = Field(min_length=1)


class RecipeIngredient(BaseModel):
    ingredient_id: int
    ingredient_name: str
    quantity: float
    unit: str
    unit_price: float
    estimated_cost: float


class Recipe(BaseModel):
    id: int
    name: str
    servings: int
    total_cost: float
    cost_per_serving: float
    ingredients: List[RecipeIngredient]


class MealPlanCreate(BaseModel):
    day_of_week: str = Field(min_length=1, max_length=20)
    recipe_id: int


class MealPlanEntry(BaseModel):
    day_of_week: str
    recipe_id: int
    recipe_name: str
    total_cost: float
    cost_per_serving: float

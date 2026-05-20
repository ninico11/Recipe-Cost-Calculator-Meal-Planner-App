import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const emptyIngredientForm = { name: "", quantity: "", unit: "", price: "" };
const emptyRecipeForm = { name: "", servings: "1", ingredients: [{ ingredient_id: "", quantity: "" }] };

function App() {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [mealPlan, setMealPlan] = useState([]);
  const [weeklyCost, setWeeklyCost] = useState(0);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);
  const [recipeForm, setRecipeForm] = useState(emptyRecipeForm);
  const [mealPlanForm, setMealPlanForm] = useState({ day_of_week: DAYS[0], recipe_id: "" });
  const [editingIngredientId, setEditingIngredientId] = useState(null);
  const [status, setStatus] = useState("Loading data...");

  useEffect(() => {
    loadAllData();
  }, []);

  async function request(path, options) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(data.detail || "Request failed");
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async function loadAllData(message = "Data loaded.") {
    try {
      const [ingredientData, recipeData, mealPlanData, weeklyCostData] = await Promise.all([
        request("/ingredients"),
        request("/recipes"),
        request("/meal-plan"),
        request("/meal-plan/weekly-cost"),
      ]);
      setIngredients(ingredientData);
      setRecipes(recipeData);
      setMealPlan(mealPlanData);
      setWeeklyCost(weeklyCostData.weekly_total_cost);
      setStatus(message);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function submitIngredient(event) {
    event.preventDefault();
    const payload = {
      name: ingredientForm.name.trim(),
      quantity: Number(ingredientForm.quantity),
      unit: ingredientForm.unit.trim(),
      price: Number(ingredientForm.price),
    };

    try {
      if (editingIngredientId) {
        await request(`/ingredients/${editingIngredientId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await loadAllData("Ingredient updated.");
      } else {
        await request("/ingredients", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await loadAllData("Ingredient added.");
      }
      setIngredientForm(emptyIngredientForm);
      setEditingIngredientId(null);
    } catch (error) {
      setStatus(error.message);
    }
  }

  function startEditIngredient(ingredient) {
    setIngredientForm({
      name: ingredient.name,
      quantity: String(ingredient.quantity),
      unit: ingredient.unit,
      price: String(ingredient.price),
    });
    setEditingIngredientId(ingredient.id);
    setStatus(`Editing ${ingredient.name}.`);
  }

  async function removeIngredient(id) {
    try {
      await request(`/ingredients/${id}`, { method: "DELETE" });
      if (editingIngredientId === id) {
        setIngredientForm(emptyIngredientForm);
        setEditingIngredientId(null);
      }
      await loadAllData("Ingredient deleted.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function updateRecipeIngredient(index, field, value) {
    setRecipeForm((current) => {
      const nextIngredients = current.ingredients.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      );
      return { ...current, ingredients: nextIngredients };
    });
  }

  function addRecipeIngredientRow() {
    setRecipeForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ingredient_id: "", quantity: "" }],
    }));
  }

  function removeRecipeIngredientRow(index) {
    setRecipeForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function submitRecipe(event) {
    event.preventDefault();
    const payload = {
      name: recipeForm.name.trim(),
      servings: Number(recipeForm.servings),
      ingredients: recipeForm.ingredients
        .filter((item) => item.ingredient_id && item.quantity)
        .map((item) => ({
          ingredient_id: Number(item.ingredient_id),
          quantity: Number(item.quantity),
        })),
    };

    try {
      await request("/recipes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setRecipeForm(emptyRecipeForm);
      await loadAllData("Recipe created.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function submitMealPlan(event) {
    event.preventDefault();
    try {
      await request("/meal-plan", {
        method: "POST",
        body: JSON.stringify({
          day_of_week: mealPlanForm.day_of_week,
          recipe_id: Number(mealPlanForm.recipe_id),
        }),
      });
      await loadAllData("Meal plan updated.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Laboratory App</p>
          <h1>Recipe Cost Calculator & Meal Planners</h1>
          <p className="hero-copy">
            Track ingredient prices, build recipes, calculate cost per serving, and organize a weekly meal plan.
          </p>
        </div>
        <div className="summary-card">
          <span>Weekly planned cost</span>
          <strong>${weeklyCost.toFixed(2)}</strong>
          <small>{mealPlan.length} planned day(s)</small>
        </div>
      </header>

      <p className="status-banner">{status}</p>

      <main className="content-grid">
        <section className="panel">
          <h2>Ingredients</h2>
          <form className="form-grid" onSubmit={submitIngredient}>
            <input
              placeholder="Name"
              value={ingredientForm.name}
              onChange={(event) => setIngredientForm({ ...ingredientForm, name: event.target.value })}
              required
            />
            <input
              placeholder="Package quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={ingredientForm.quantity}
              onChange={(event) => setIngredientForm({ ...ingredientForm, quantity: event.target.value })}
              required
            />
            <input
              placeholder="Unit"
              value={ingredientForm.unit}
              onChange={(event) => setIngredientForm({ ...ingredientForm, unit: event.target.value })}
              required
            />
            <input
              placeholder="Package price"
              type="number"
              min="0"
              step="0.01"
              value={ingredientForm.price}
              onChange={(event) => setIngredientForm({ ...ingredientForm, price: event.target.value })}
              required
            />
            <div className="button-row">
              <button type="submit">{editingIngredientId ? "Update ingredient" : "Add ingredient"}</button>
              {editingIngredientId ? (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setIngredientForm(emptyIngredientForm);
                    setEditingIngredientId(null);
                    setStatus("Ingredient form reset.");
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="table-list">
            {ingredients.map((ingredient) => (
              <article key={ingredient.id} className="list-card">
                <div>
                  <h3>{ingredient.name}</h3>
                  <p>
                    {ingredient.quantity} {ingredient.unit} for ${ingredient.price.toFixed(2)}
                  </p>
                </div>
                <div className="button-row">
                  <button type="button" className="button-secondary" onClick={() => startEditIngredient(ingredient)}>
                    Edit
                  </button>
                  <button type="button" className="button-danger" onClick={() => removeIngredient(ingredient.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {ingredients.length === 0 ? <p className="empty-state">No ingredients yet.</p> : null}
          </div>
        </section>

        <section className="panel">
          <h2>Recipes</h2>
          <form className="form-grid" onSubmit={submitRecipe}>
            <input
              placeholder="Recipe name"
              value={recipeForm.name}
              onChange={(event) => setRecipeForm({ ...recipeForm, name: event.target.value })}
              required
            />
            <input
              placeholder="Servings"
              type="number"
              min="1"
              step="1"
              value={recipeForm.servings}
              onChange={(event) => setRecipeForm({ ...recipeForm, servings: event.target.value })}
              required
            />

            <div className="recipe-builder">
              <div className="section-header">
                <h3>Recipe ingredients</h3>
                <button type="button" className="button-secondary" onClick={addRecipeIngredientRow}>
                  Add row
                </button>
              </div>
              {recipeForm.ingredients.map((item, index) => (
                <div key={`${index}-${item.ingredient_id}`} className="recipe-row">
                  <select
                    value={item.ingredient_id}
                    onChange={(event) => updateRecipeIngredient(index, "ingredient_id", event.target.value)}
                    required
                  >
                    <option value="">Select ingredient</option>
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Amount used"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => updateRecipeIngredient(index, "quantity", event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => removeRecipeIngredientRow(index)}
                    disabled={recipeForm.ingredients.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" disabled={ingredients.length === 0}>
              Create recipe
            </button>
          </form>

          <div className="table-list">
            {recipes.map((recipe) => (
              <article key={recipe.id} className="list-card list-card-wide">
                <div className="recipe-title-row">
                  <h3>{recipe.name}</h3>
                  <span>{recipe.servings} servings</span>
                </div>
                <p>
                  Total cost: <strong>${recipe.total_cost.toFixed(2)}</strong>
                  {" · "}
                  Cost per serving: <strong>${recipe.cost_per_serving.toFixed(2)}</strong>
                </p>
                <ul className="ingredient-breakdown">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={`${recipe.id}-${ingredient.ingredient_id}`}>
                      {ingredient.ingredient_name}: {ingredient.quantity} {ingredient.unit} (${ingredient.estimated_cost.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </article>
            ))}
            {recipes.length === 0 ? <p className="empty-state">No recipes yet.</p> : null}
          </div>
        </section>

        <section className="panel panel-full">
          <h2>Meal Planner</h2>
          <form className="planner-form" onSubmit={submitMealPlan}>
            <select
              value={mealPlanForm.day_of_week}
              onChange={(event) => setMealPlanForm({ ...mealPlanForm, day_of_week: event.target.value })}
            >
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <select
              value={mealPlanForm.recipe_id}
              onChange={(event) => setMealPlanForm({ ...mealPlanForm, recipe_id: event.target.value })}
              required
            >
              <option value="">Select recipe</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
            <button type="submit" disabled={recipes.length === 0}>
              Save day plan
            </button>
          </form>

          <div className="meal-grid">
            {DAYS.map((day) => {
              const plan = mealPlan.find((entry) => entry.day_of_week === day);
              return (
                <article key={day} className="day-card">
                  <span>{day}</span>
                  {plan ? (
                    <>
                      <h3>{plan.recipe_name}</h3>
                      <p>${plan.total_cost.toFixed(2)} total</p>
                      <small>${plan.cost_per_serving.toFixed(2)} per serving</small>
                    </>
                  ) : (
                    <p className="empty-state">No recipe planned.</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

-- Lernziel-Piktogramm zentral ergänzen, ohne Kopien in jedem QMD-Kasten.
-- Die Positionierung in learning-boxes.css gilt für das HTML-Workbook.
function Div(el)
  if not quarto.doc.is_format("html") then
    return nil
  end
  if el.classes:includes("mp-goal-strip") then
    local icon = pandoc.Image(
      {pandoc.Str("Lernziele")},
      "assets/task-icons/learning-goal.svg",
      "",
      pandoc.Attr("", {"mp-goal-icon"})
    )
    el.content:insert(1, pandoc.Plain({icon}))
    return el
  end
end

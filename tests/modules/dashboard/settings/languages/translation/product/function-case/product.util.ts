export const transformSFProductData = data => {
  const result = [];
  // Title
  result.push({
    field_name: "Title",
    source_value: data.title,
    target_value: "",
  });

  // Description
  result.push({
    field_name: "Description",
    source_value: data.description,
    target_value: "",
  });

  // Variants
  const variants = data.variants.map(variant => variant.title);
  for (const variant of variants) {
    result.push({
      field_name: "Variant title",
      source_value: variant,
      target_value: "",
    });
  }

  const options = data.options;
  for (const option of options) {
    result.push({
      field_name: "Option name",
      source_value: option.name,
      target_value: "",
    });

    for (const optionItem of option.values) {
      result.push({
        field_name: "Option value",
        source_value: optionItem.name,
        target_value: "",
      });
    }
  }

  // custom options
  const customOptions = data.custom_options;

  // text
  const textCustomOption = customOptions[0];
  result.push({
    field_name: "Label",
    source_value: textCustomOption.label,
    target_value: "",
  });
  result.push({
    field_name: "Placeholder",
    source_value: textCustomOption.placeholder,
    target_value: "",
  });

  // textarea
  const textareaCustomOption = customOptions[1];
  result.push({
    field_name: "Label",
    source_value: textareaCustomOption.label,
    target_value: "",
  });
  result.push({
    field_name: "Placeholder",
    source_value: textareaCustomOption.placeholder,
    target_value: "",
  });

  // image
  const imageCustomOption = customOptions[2];
  result.push({
    field_name: "Label",
    source_value: imageCustomOption.label,
    target_value: "",
  });
  result.push({
    field_name: "Help text",
    source_value: imageCustomOption.help_text,
    target_value: "",
  });

  // radio
  const radioCustomOption = customOptions[3];
  result.push({
    field_name: "Label",
    source_value: radioCustomOption.label,
    target_value: "",
  });

  for (const value of radioCustomOption.values) {
    result.push({
      field_name: "Value",
      source_value: value.text,
      target_value: "",
    });
  }

  // droplist
  const droplistCustomOption = customOptions[4];
  result.push({
    field_name: "Label",
    source_value: droplistCustomOption.label,
    target_value: "",
  });

  for (const value of droplistCustomOption.values) {
    result.push({
      field_name: "Value",
      source_value: value.text,
      target_value: "",
    });
  }

  // checkbox
  const checkboxCustomOption = customOptions[5];
  result.push({
    field_name: "Label",
    source_value: checkboxCustomOption.label,
    target_value: "",
  });

  for (const value of checkboxCustomOption.values) {
    result.push({
      field_name: "Value",
      source_value: value.text,
      target_value: "",
    });
  }

  return result;
};

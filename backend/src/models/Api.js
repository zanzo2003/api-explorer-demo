const mongoose = require("mongoose");

const ApiSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    baseUrl: { type: String, required: true },
    description: { type: String, default: "" },
    version: { type: String, default: "1.0.0" },
    category: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    source: {
      type: String,
      enum: ["openapi", "html", "manual"],
      default: "openapi",
    },
    specUrl: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    license: { type: String, default: "" },
    endpointCount: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ApiSchema.index({ name: "text", description: "text", tags: "text" });
ApiSchema.index({ category: 1 });

module.exports = mongoose.model("Api", ApiSchema);

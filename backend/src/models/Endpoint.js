const mongoose = require("mongoose");

const ParamSchema = new mongoose.Schema(
  {
    name: { type: String },
    in: { type: String, enum: ["query", "path", "header", "cookie", "body"], default: "query" },
    description: { type: String, default: "" },
    required: { type: Boolean, default: false },
    type: { type: String, default: "string" },
    example: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const EndpointSchema = new mongoose.Schema(
  {
    apiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Api",
      required: true,
      index: true,
    },
    path: { type: String, required: true },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      required: true,
    },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    operationId: { type: String, default: "" },
    tags: { type: [String], default: [] },
    params: { type: [ParamSchema], default: [] },
    headers: { type: [ParamSchema], default: [] },
    body: { type: mongoose.Schema.Types.Mixed, default: null },
    bodyType: {
      type: String,
      enum: ["json", "form", "multipart", "none"],
      default: "none",
    },
    responseExample: { type: mongoose.Schema.Types.Mixed, default: null },
    responseSchema: { type: mongoose.Schema.Types.Mixed, default: null },
    security: { type: [String], default: [] },
    deprecated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EndpointSchema.index({ apiId: 1, path: 1, method: 1 });
EndpointSchema.index({ tags: 1 });

module.exports = mongoose.model("Endpoint", EndpointSchema);

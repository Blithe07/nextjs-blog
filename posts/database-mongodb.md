---
title: "MongoDB"
date: "2023-05-30"
category: "database"
---

## Mongoose Basic

### introduction

> The object model tool of MongoDB. Provides definitions similar to Schema table structures, as well as mechanisms such as Hook、Plugin、Virtual、Populate.

### core concept

    - Object Relation Mapping
        Used to achieve conversion between different types of system data in object-oriented programming languages.
        In effect, it actually creates a virtual object database that can be used in programming languages.
    - Schema
        Database model skeleton stored in text form.
    - Model
        Build by Schema. In addition to containing the database skeleton defined by the Schema, it also includes the behavior of database operations.
    - Entity
        Create by Model. Include CRUD operations.
        - save
        - find、findOne
        - update、findByIdAndUpdate、findOneAndUpdate
        - remove

### Schema Type

String,Number,Boolean,Array,Buffer,Date,Object...

```
var schema = new Mongoose.Schema({
    name: String,
    age: { type: Number, min: 18, max: 65},
    array: []
})
```

## Mongoose Advanced

### Model Extension

    - Class
        Specific behavior that doesn't belong to a certain user.
        Usage:
            Schema.statics.xxx = function(field, cb) {
                return this.findOne({
                    field
                }, cb)
            }
            Model.xxx(field,cb)
    - Object
        Specific behavior that belong to a certain user.
        Usage:
            Schema.methods.yyy = function(query, cb){
                return this.model('UserModel').findOne(query, cb)
            }
            const user = new UserModel({})
            user.yyy(query, cb)

### Virtual Property

    Secondary definition based on existing database property, like vue computed. Avoiding database field redundancy.

### Callback Hooks

    Add 'pre' and 'post' callback for database operations.

    The benefit of the following code is that it only cares about saving behavior and doesn't care about specific behaviors such as security.
    Example:
        UserSchema.pre('save', function(next){
            const that = this;

            bcrypt.genSalt(this._salt_bounds, function(err, salt){
                if(err){
                    return next();
                }

                bcrypt.hash(that.password, salt, function(error, hash){
                    if(err){
                        return;
                    }
                    that.password = hash;
                    return next();
                })
            })
        })

### Plugin

    Encapsulation based on Dynamic Extension Capability of Schema.

    Usage:
        module.exports = function lastModifiedPlugin (schema, options){
            // add schema field dynamic
            schema.add({ lastModified: Date })

            schema.pre('save', function(next){
                this.lastMod = new Date()
                next()
            })

            if(options && options.index){
                schema.path('lastMod').index(options.index)
            }
        }
        const model = new Schema({...})
        model.plugin(lastModifiedPlugin, { index: true })

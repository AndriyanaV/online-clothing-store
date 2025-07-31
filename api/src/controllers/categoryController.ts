import { validateRequestWithZod } from "../middleware/validateRequestMiddleware";
import { Category } from "../models/category";
import {  addCategoryBodySchema, updateCategorySchema } from "../schemas/category/addCategory";
import { Request, Response } from 'express';
import { createErrorJson, createSuccessJson } from '../utils/responseWrapper';
import { ApiResponse } from "../types/common";
import { uploadFiles } from "../middleware/uploadMilldeware";
import { UploadFilesOptions, UploadPath, UploadType } from "../types/uploadFiles";
import path from 'path';
import { CategoryInfo, CategoryWithPopulatedSubs, SubCategoryInfo, SubCategory, categoryDto, UpdateCategoryDto } from "../types/category";
import { request } from "http";
import mongoose from "mongoose";
import fs from 'fs';
import { validateRequestWithZodAndCleanFiles } from "../middleware/validateRequestWithZodAndCleanFiles";


// export const addCategory=[
//     validateRequestWithZod(addCategoryBodySchema),
    
//     async(
//         req:Request<{},{}, Category>,
//         res:Response<ApiResponse<null>>
//     )=>{

//         try{

//             const categoryName= await Category.findOne({name:req.body.name})

//             if(categoryName){
//                 res.status(400).json(createErrorJson([{ type: 'addCategory', msg: 'BE_category_already_exists' }]));
//                 return;
//             }

//             const newCategory= new Category({
//                 name:req.body.name,
//                 description:req.body.description,
//                 isMainCategory:req.body.isMainCategory,
//                 subcategories:req.body.subcategories
//             })

//             await newCategory.save();

//             res.status(200).json(createSuccessJson('BE_category_sucessfully_added', null));
//             return;

//         }
//         catch(error:any){
//                     console.error(error);
//                      res.status(500).json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
//                      return;
//             }

//     }
// ]

// Podešavaš opcije za upload
const uploadOptions = {
  type: UploadType.SINGLE,
  uploadPath: UploadPath.CATEGORY,
  maxFileSize: 5 * 1024 * 1024, // npr 5MB
};
   
export const addCategory= [
    uploadFiles(uploadOptions),
    validateRequestWithZodAndCleanFiles(addCategoryBodySchema, UploadPath.CATEGORY),

    async(
        req:Request<{},{}, Category>,
        res:Response<ApiResponse<null>>
    )=>{

        try{
            const categoryName= await Category.findOne({name:req.body.name})
            const files = req.files as Express.Multer.File[];

            if (categoryName) {
                if (files && files.length > 0) {
                    // req.files je niz fajlova, uzimamo prvi fajl
                    const firstFile = files[0];
                    const filePath = path.join(__dirname, '..', '..', 'uploads', UploadPath.CATEGORY, firstFile.filename);

                    try {
                        // Koristimo promisified verziju unlink sa await
                        await fs.promises.unlink(filePath);
                        console.log(`Successfully deleted uploaded file: ${filePath}`);
                    } catch (err) {
                        console.error('Failed to delete uploaded file:', err);
                    }
                }

                res.status(400).json(createErrorJson([{ type: 'addCategory', msg: 'BE_category_already_exists' }]));
                return;
            }


            let imageUrl = null;
            // const files = req.files as Express.Multer.File[];

            if (files && files.length > 0) {
            const firstFile = files[0];

            const relativeFilePath = path.relative('uploads', firstFile.path).replace(/\\/g, '/');
            imageUrl=relativeFilePath;
            }

            const newCategory= new Category({
                name:req.body.name,
                description:req.body.description,
                isMainCategory:req.body.isMainCategory,
                subcategories:req.body.subcategories,
                categoryImageUrl:imageUrl
            })

            await newCategory.save();

            res.status(200).json(createSuccessJson('BE_category_sucessfully_added', null));
            return;

        } catch(error:any){
                    console.error(error);
                     res.status(500).json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
                     return;
            }

        }
    
]

export const getMainCategories = async (req:Request<{}, {}, {}>,
 res:Response<ApiResponse<CategoryInfo[]>>
)=> {

    try{

         const mainCategories= await Category.find({isMainCategory:true}).lean();

         const categoriesWithStringId = mainCategories.map(cat => ({
            ...cat,
            _id: cat._id.toString()
        }));

         res.status(201).json(
                         createSuccessJson<CategoryInfo[]>("BE_categories_fetch_successfully", categoriesWithStringId));
                     

    }catch(error:any){
         res.status(500).json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
         return;

    }
}


export const getSubcategoriesOfMainCategory= async (req:Request<{categoryId: string}, {}, {}>,
 res:Response<ApiResponse<CategoryWithPopulatedSubs>>
)=> {
    try{
        const categoryId = req.params.categoryId;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
           res.status(404).json(createErrorJson([{ type: 'get-main-category-subcategories', msg: 'BE_invalid_categoryId_format' }]));
           return;
        }

        const mainCategoryWithSubcategories: CategoryWithPopulatedSubs | null =
            await Category.findOne({ _id: categoryId, isMainCategory: true }).select('-name -description -isMainCategory -categoryImageUrl -createdAt -updatedAt')
            .populate('subcategories')
            .lean() as unknown as CategoryWithPopulatedSubs;

        

        if (!mainCategoryWithSubcategories) {
            res.status(404).json(
            createErrorJson([
            {
            type: 'get-subcategories',
            msg: 'BE_category_not_found',
          },
        ])
      );
      return;
    }

    mainCategoryWithSubcategories._id = mainCategoryWithSubcategories._id.toString();

    // Prolazimo kroz svaki element u subcategories i konvertujemo _id u string
    mainCategoryWithSubcategories.subcategories = mainCategoryWithSubcategories.subcategories.map(subcat => ({
        ...subcat,
        _id: subcat._id.toString(),
    }));
    
//          if (mainCategoryWithSubcategories && Array.isArray(mainCategoryWithSubcategories.subcategories)) {
//   mainCategoryWithSubcategories.subcategories.forEach(subcategory => {
//     console.log('Subcategory ID:', subcategory._id, 'Type of _id:', typeof subcategory._id);
//   });
// } else {
//   console.log('Nema podkategorija ili objekat nije definisan');
// }

    res.status(200).json(createSuccessJson("BE_get_main_category_subcategories_success", mainCategoryWithSubcategories));
     
    }catch(error:any){
         res.status(500).json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
         return;

    }

}

export const updateCategory = [
    validateRequestWithZod(updateCategorySchema),
    async (
        req: Request<{ categoryId: string }, {}, UpdateCategoryDto>,
        res: Response<ApiResponse<null>>
    ) => {
        try {
            const category = await Category.findOne({ _id: req.params.categoryId });

            if (!category) {
                res.status(400).json(createErrorJson([{ type: 'general', msg: 'category_not_exist' }]));
                return;
            }

            category.name=req.body.name;
            category.description=req.body.description;
            category.isMainCategory=req.body.isMainCategory;
            category.subcategories = req.body.subcategories ? req.body.subcategories : category.subcategories;


            await category.save(); 

            res
                .status(200)
                .json(createSuccessJson('BE_category_updated_successfully', null));
        } catch (error: any) {
            console.error(error);
            res
                .status(500)
                .json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
        }
    },
];


export const updateCategoryImage = [
    uploadFiles(uploadOptions),

    async (
        req: Request<{ categoryId: string }, {}, {}>,
        res: Response<ApiResponse<null>>
    ) => {

        
        try {
            const category = await Category.findOne({ _id: req.params.categoryId });
            const files = req.files as Express.Multer.File[];

            if (!category) {
                if (files?.length) {
                    try {
                        await fs.promises.unlink(files[0].path);
                        console.log('Uploaded file deleted due to invalid categoryId');
                    } catch (err) {
                        console.error('Failed to delete uploaded file:', err);
                    }
                }
                res.status(400).json(createErrorJson([{ type: 'general', msg: 'category_not_exist' }]));
                return;
            }

            
            const oldImagePath = category.categoryImageUrl;
            let newPath = oldImagePath;

            if (files?.length) {
                const firstFile = files[0];
                const relativeFilePath = path
                    .relative('uploads', firstFile.path)
                    .replace(/\\/g, '/');

                newPath = relativeFilePath;
                category.categoryImageUrl = newPath;
            }

            if (oldImagePath && oldImagePath !== newPath) {
                const fullOldPath = path.join('uploads', oldImagePath);
                try {
                    await fs.promises.unlink(fullOldPath);
                    console.log('Old image deleted:', fullOldPath);
                } catch (err) {
                    console.error('Failed to delete old image:', err);
                }
            }

            await category.save();

            res
                .status(200)
                .json(createSuccessJson('BE_category_image_updated_successfully', null));


        } catch (error: any) {
            console.error(error);
            res
                .status(500)
                .json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
        }
    }]


export const getCategory = async (
        req: Request<{ categoryId: string }, {}, {}>,
        res: Response<ApiResponse<categoryDto>>
    ) => {

        try {
            const category = await Category.findOne({ _id: req.params.categoryId }).populate('subcategories');

            if (!category) {
                res.status(400).json(createErrorJson([{ type: 'general', msg: 'category_not_exist' }]));
                return;
            }

            const {_id:v, ...rest} = category.toObject();

            const publicCategory = {
                _id: category._id.toString(),
                ...rest
            };

            res.status(200).json(createSuccessJson('BE_category_fetched_successfully', publicCategory));

        } catch (error: any) {
            console.error(error);
            res
                .status(500)
                .json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
        }

}

export const deleteCategory = async (
        req: Request<{ categoryId: string }, {}, {}>,
        res: Response<ApiResponse<null>>
    ) => {

        try {
            const category = await Category.findOneAndDelete({ _id: req.params.categoryId });

            if (!category) {
                res.status(400).json(createErrorJson([{ type: 'general', msg: 'category_not_exist' }]));
                return;
            }

            res.status(200).json(createSuccessJson('BE_category_deletd_successfully', null));

        } catch (error: any) {
            console.error(error);
            res
                .status(500)
                .json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
        }

}

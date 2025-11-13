# Lint and TypeScript Error Resolution Plan for Narramorph Project

## Executive Summary

The Narramorph project currently has **7 TypeScript compilation errors** across 4 files and a significant number of ESLint errors (estimated from the large lint-errors.txt file). The TypeScript errors are primarily related to unused variables, missing properties in type definitions, and incorrect type annotations.

### Key Blockers Requiring Immediate Attention:
1. Missing `journeyTracking` property in test files (2 instances)
2. Non-existent `chapterTitle` property on `NodeMetadata` type
3. Unused `@ts-expect-error` directives (2 instances)

### Quick Wins:
1. Remove unused imports (`useCallback`, `progress` variable)
2. Clean up unused `@ts-expect-error` directives
3. Fix type annotation issues

## Error Analysis Summary

### TypeScript Errors by Category:
- **Type Definition Issues**: 3 errors (missing properties, incorrect types)
- **Unused Code**: 4 errors (imports, variables, directives)

### Critical vs. Non-Critical Issues:
- **Critical (Blockers)**: 3 errors
  - Missing `journeyTracking` property in test files
  - Non-existent `chapterTitle` property
- **High Priority**: 2 errors
  - Unused `@ts-expect-error` directives
- **Medium Priority**: 2 errors
  - Unused imports and variables

### Error Distribution:
```
src/stores/storyStore.test.ts:    2 errors (29%)
src/components/UI/JourneyTracker.tsx: 2 errors (29%)
src/components/StoryView/StoryView.tsx: 2 errors (29%)
src/components/NodeMap/CustomStoryNode.tsx: 1 error (14%)
```

## Prioritized Action Plan

### Immediate Actions (Critical Priority - Week 1)
1. **Fix Missing journeyTracking Property**
   - Files: `src/stores/storyStore.test.ts` (lines 11, 233)
   - Add missing `journeyTracking` property to test objects
   - Verify against `src/types/Store.ts` definition

2. **Fix NodeMetadata Type Issue**
   - File: `src/components/UI/JourneyTracker.tsx` (line 225)
   - Either add `chapterTitle` to `NodeMetadata` type or update component logic
   - Verify impact on other components using this type

### Short-term Actions (High Priority - Week 1-2)
1. **Remove Unused @ts-expect-error Directives**
   - Files: `src/components/NodeMap/CustomStoryNode.tsx` (line 125)
   - File: `src/components/StoryView/StoryView.tsx` (line 77)
   - Replace with proper type fixes or remove if no longer needed

2. **Clean Up Unused Imports and Variables**
   - File: `src/components/StoryView/StoryView.tsx` (line 1)
   - File: `src/components/UI/JourneyTracker.tsx` (line 187)
   - Remove unused `useCallback` import and `progress` variable

### Medium-term Actions (Medium Priority - Week 2-3)
1. **Address ESLint Errors**
   - Run `npm run lint:fix` to auto-fix formatting and simple issues
   - Manually fix remaining ESLint errors by category
   - Focus on maintainability and code quality issues

2. **Improve Type Safety**
   - Review and strengthen type definitions
   - Add proper type annotations where missing
   - Consider implementing stricter TypeScript compiler options

### Long-term Actions (Low Priority - Week 3-4)
1. **Preventive Measures**
   - Set up pre-commit hooks for linting and type checking
   - Configure CI/CD to fail on lint/TypeScript errors
   - Establish code review guidelines for type safety

2. **Documentation and Training**
   - Document type definitions and usage patterns
   - Create team guidelines for TypeScript best practices
   - Consider pair programming sessions for complex type issues

## Detailed Implementation Steps

### Phase 1: Critical TypeScript Fixes (Day 1-2)

#### Step 1.1: Fix journeyTracking Property
```bash
# Command to identify the exact type definition
grep -r "journeyTracking" src/types/Store.ts

# Edit src/stores/storyStore.test.ts
# Add journeyTracking property to test objects at lines 11 and 233
```

Expected fix:
```typescript
// In test files, add to progress object:
progress: {
  // existing properties...
  journeyTracking: {
    // Add appropriate mock data based on JourneyTracking type
  }
}
```

#### Step 1.2: Fix NodeMetadata Type Issue
```bash
# Command to find NodeMetadata definition
grep -r "interface NodeMetadata" src/
grep -r "type NodeMetadata" src/
```

Two possible approaches:
1. Add `chapterTitle` to NodeMetadata type definition
2. Update component to handle missing property gracefully

#### Step 1.3: Verification
```bash
npm run type-check
# Should show 0 TypeScript errors
```

### Phase 2: Cleanup and Quick Wins (Day 2-3)

#### Step 2.1: Remove Unused Directives
```bash
# Edit src/components/NodeMap/CustomStoryNode.tsx
# Remove or replace @ts-expect-error at line 125

# Edit src/components/StoryView/StoryView.tsx
# Remove or replace @ts-expect-error at line 77
```

#### Step 2.2: Clean Up Unused Code
```bash
# Edit src/components/StoryView/StoryView.tsx
# Remove unused useCallback import from line 1

# Edit src/components/UI/JourneyTracker.tsx
# Remove unused progress variable at line 187
```

#### Step 2.3: Verification
```bash
npm run type-check
npm run lint
# Should show significant reduction in errors
```

### Phase 3: ESLint Resolution (Day 3-5)

#### Step 3.1: Auto-fixable Issues
```bash
npm run lint:fix
# This will fix formatting and simple issues automatically
```

#### Step 3.2: Manual ESLint Fixes
```bash
# Generate categorized error list
npm run lint > lint-categorized.txt

# Fix errors by category:
# 1. Import/order issues
# 2. Unused variables/imports
# 3. Code style issues
# 4. React-specific issues
```

#### Step 3.3: Verification
```bash
npm run lint:ci
# Should pass with 0 warnings
```

### Phase 4: Prevention and CI/CD (Day 5-7)

#### Step 4.1: Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add to package.json scripts:
"prepare": "husky install",
"lint-staged": "lint-staged"

# Create .husky/pre-commit file
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npm run validate
```

#### Step 4.2: CI/CD Updates
```yaml
# Add to .github/workflows/ci.yml (if exists)
- name: Run type check
  run: npm run type-check

- name: Run linting
  run: npm run lint:ci
```

## Team Responsibilities

### TypeScript Specialist
- Lead type definition fixes
- Review complex type issues
- Establish type safety guidelines

### Frontend Developer
- Fix component-level TypeScript errors
- Address React-specific linting issues
- Implement UI-related fixes

### QA Engineer
- Verify fixes don't break functionality
- Update test cases as needed
- Validate error resolution

### DevOps Engineer
- Implement CI/CD improvements
- Set up pre-commit hooks
- Configure automated error reporting

### Dependencies Between Team Members:
1. TypeScript Specialist must complete type fixes before Frontend Developer can implement component changes
2. QA Engineer should verify fixes after each phase
3. DevOps Engineer can work on CI/CD improvements in parallel with other fixes

### Communication Plan:
- Daily standups to track progress
- Pull request reviews for all changes
- Dedicated Slack channel for error resolution discussions
- Weekly retrospective on error prevention

## Timeline and Milestones

### Week 1: Critical Fixes
- **Day 1-2**: Fix all TypeScript compilation errors
- **Day 3**: Verify TypeScript fixes and begin ESLint auto-fixes
- **Day 4-5**: Complete manual ESLint fixes
- **Success Criteria**: `npm run type-check` and `npm run lint:ci` pass with 0 errors

### Week 2: Prevention and Documentation
- **Day 1-2**: Implement pre-commit hooks and CI/CD improvements
- **Day 3-4**: Create documentation and team guidelines
- **Day 5**: Team training and knowledge sharing
- **Success Criteria**: All automated checks pass, team trained on new processes

### Week 3-4: Monitoring and Optimization
- **Ongoing**: Monitor for new errors
- **Weekly**: Review and refine processes
- **Success Criteria**: Zero regression in error counts

### Progress Tracking:
1. Create GitHub project board with error categories
2. Use GitHub milestones for weekly targets
3. Track error count reduction in daily reports
4. Celebrate milestones when error categories are eliminated

## Prevention Measures

### Development Workflow Changes
1. **Mandatory Pre-commit Checks**
   ```json
   // package.json addition
   "lint-staged": {
     "*.{js,jsx,ts,tsx}": [
       "eslint --cache --fix",
       "prettier --write"
     ]
   }
   ```

2. **Stricter TypeScript Configuration**
   ```json
   // tsconfig.json additions
   "compilerOptions": {
     "strict": true,
     "noImplicitAny": true,
     "noImplicitReturns": true,
     "noUnusedLocals": true,
     "noUnusedParameters": true
   }
   ```

3. **Enhanced ESLint Rules**
   ```javascript
   // .eslintrc.cjs additions
   rules: {
     '@typescript-eslint/no-unused-vars': 'error',
     'unused-imports/no-unused-imports': 'error',
     '@typescript-eslint/explicit-function-return-type': 'warn'
   }
   ```

### Code Review Guidelines
1. All PRs must pass `npm run validate`
2. Require at least one review for type-related changes
3. Use GitHub's required status checks for CI/CD
4. Document type decisions in complex components

### Team Training
1. TypeScript advanced features workshop
2. ESLint configuration and customization
3. Type-driven development practices
4. Code review best practices for type safety

### Monitoring and Alerting
1. Set up error tracking in development environment
2. Create dashboard for error trends
3. Automated reports for new error introduction
4. Regular audits of type definitions and usage

## Conclusion

This plan provides a structured approach to resolving the current lint and TypeScript errors in the Narramorph project. By following the prioritized action plan, the team can systematically eliminate errors while implementing preventive measures to maintain code quality going forward.

The key to success is addressing the critical TypeScript errors first, then systematically working through the ESLint issues while implementing long-term prevention strategies. Regular communication and clear responsibilities will ensure the team stays on track and maintains momentum throughout the error resolution process.